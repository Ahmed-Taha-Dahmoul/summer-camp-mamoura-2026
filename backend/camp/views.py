from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import ScoutGroup, ScoutProfile, InviteCode, Game, GameScore
from .serializers import ScoutGroupSerializer, ScoutProfileSerializer, InviteCodeSerializer
from instantane.models import InstantanePost, InstantaneReaction
from django.utils import timezone
from datetime import timedelta
from rest_framework.exceptions import PermissionDenied

class IsAmiidOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == 'AMIID'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.leader == request.user

class ScoutGroupViewSet(viewsets.ModelViewSet):
    queryset = ScoutGroup.objects.all()
    serializer_class = ScoutGroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsAmiidOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        if self.request.user.role != 'AMIID':
            raise PermissionDenied("Only Amiids can create groups.")
        serializer.save(leader=self.request.user)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profile = ScoutProfile.objects.get(user_id=user_id, scout_group=group)
            # Remove from group and disable account as per user request
            profile.scout_group = None
            profile.save()
            
            user = profile.user
            user.is_active = False
            user.save()
            
            return Response({"status": "Member removed and account disabled."})
        except ScoutProfile.DoesNotExist:
            return Response({"error": "Member not found in this group."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        new_role = request.data.get('role')

        if not user_id or not new_role:
            return Response({"error": "user_id and role are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate role choice
        valid_roles = dict(ScoutProfile.ROLE_CHOICES).keys()
        if new_role not in valid_roles:
            return Response({"error": f"Invalid role. Must be one of {list(valid_roles)}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = ScoutProfile.objects.get(user_id=user_id, scout_group=group)
            profile.group_role = new_role
            profile.save()
            return Response({"status": f"Role updated to {new_role}."})
        except ScoutProfile.DoesNotExist:
            return Response({"error": "Member not found in this group."}, status=status.HTTP_404_NOT_FOUND)

class ScoutProfileViewSet(viewsets.ModelViewSet):
    queryset = ScoutProfile.objects.all()
    serializer_class = ScoutProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class InviteCodeViewSet(viewsets.ModelViewSet):
    serializer_class = InviteCodeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAmiidOrReadOnly]

    def get_queryset(self):
        # Amiids only see their own group's codes
        if self.request.user.role == 'AMIID':
            try:
                return InviteCode.objects.filter(group=self.request.user.led_group)
            except ScoutGroup.DoesNotExist:
                return InviteCode.objects.none()
        return InviteCode.objects.none()

    def perform_create(self, serializer):
        try:
            group = self.request.user.led_group
            
            # Check the limit of 8 codes per group
            code_count = InviteCode.objects.filter(group=group).count()
            if code_count >= 8:
                raise PermissionDenied("You can only generate a maximum of 8 scout invite codes for your patrol.")
                
                
            serializer.save(group=group)
        except ScoutGroup.DoesNotExist:
            raise PermissionDenied("You must create a group before generating invite codes.")

class LeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        games = Game.objects.all()
        # Include all groups, we will filter by gender on the frontend
        groups = ScoutGroup.objects.all()
        
        # --- Live Instantane Calculation ---
        instantane_games = [g for g in games if g.is_daily_instantane and g.active_since]
        today = timezone.now().date()
        
        for igame in instantane_games:
            # Reset scores for this dynamic game
            GameScore.objects.filter(game=igame).update(points=0)
            
            start_dt = igame.active_since
            start_date = start_dt.date()
            num_days = (today - start_date).days
            
            if num_days >= 0:
                for i in range(num_days + 1):
                    current_date = start_date + timedelta(days=i)
                    
                    group_reactions = {}
                    for group in groups:
                        users = [group.leader] + [p.user for p in group.members.select_related('user')]
                        
                        posts_query = InstantanePost.objects.filter(user__in=users, created_at__date=current_date)
                        
                        # If this is the launch day, only count posts made AFTER the exact launch time
                        if i == 0:
                            posts_query = posts_query.filter(created_at__gte=start_dt)
                            
                        reactions = InstantaneReaction.objects.filter(post__in=posts_query).count()
                        group_reactions[group] = reactions
                    
                    if group_reactions:
                        max_reactions = max(group_reactions.values())
                        if max_reactions > 0:
                            winners = [g for g, r in group_reactions.items() if r == max_reactions]
                            for winner in winners:
                                score, _ = GameScore.objects.get_or_create(group=winner, game=igame)
                                score.points += 1
                                score.save()
        # --- End Live Calculation ---
        
        # --- Live Wheel Calculation ---
        from django.db.models import Sum
        wheel_games = [g for g in games if g.is_wheel_spinner and g.active_since]
        for wgame in wheel_games:
            # Reset scores for this dynamic game
            GameScore.objects.filter(game=wgame).update(points=0)
            
            for group in groups:
                total_wheel = WheelSpin.objects.filter(group=group, created_at__gte=wgame.active_since).aggregate(Sum('points_won'))['points_won__sum'] or 0
                if total_wheel > 0:
                    score, _ = GameScore.objects.get_or_create(group=group, game=wgame)
                    score.points = total_wheel
                    score.save()
        # --- End Live Wheel Calculation ---
        
        leaderboard = []
        for group in groups:
            group_scores = {}
            total = 0
            for score in group.scores.all():
                group_scores[score.game_id] = score.points
                total += score.points
            
            leaderboard.append({
                'group_id': group.id,
                'group_name': group.name,
                'group_gender': group.leader.gender,
                'group_banner': request.build_absolute_uri(group.banner.url) if group.banner else None,
                'group_profile': request.build_absolute_uri(group.profile_picture.url) if group.profile_picture else None,
                'scores': group_scores,
                'total_score': total,
            })
            
        # Sort descending by total score
        leaderboard.sort(key=lambda x: x['total_score'], reverse=True)
        
        games_data = [{'id': g.id, 'name': g.name, 'gender': g.gender, 'is_bonus': g.is_daily_instantane or g.is_wheel_spinner} for g in games]
        
        return Response({
            'games': games_data,
            'leaderboard': leaderboard
        })

import random
from datetime import timedelta, datetime, time, date
from .models import WheelSpin

class WheelStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        last_spin = WheelSpin.objects.filter(user=request.user).order_by('-created_at').first()
        if not last_spin:
            return Response({"can_spin": True, "time_remaining_ms": 0})
            
        time_since_spin = timezone.now() - last_spin.created_at
        if time_since_spin > timedelta(hours=5):
            return Response({"can_spin": True, "time_remaining_ms": 0})
            
        remaining = timedelta(hours=5) - time_since_spin
        return Response({"can_spin": False, "time_remaining_ms": int(remaining.total_seconds() * 1000)})

class SpinWheelView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # 1. Check time limit
        last_spin = WheelSpin.objects.filter(user=request.user).order_by('-created_at').first()
        if last_spin:
            time_since_spin = timezone.now() - last_spin.created_at
            if time_since_spin <= timedelta(hours=5):
                return Response({"detail": "You must wait 5 hours between spins."}, status=400)
                
        # 2. Find user group
        group = None
        if hasattr(request.user, 'profile') and request.user.profile.scout_group:
            group = request.user.profile.scout_group
        elif hasattr(request.user, 'led_group'):
            group = request.user.led_group
            
        if not group:
            return Response({"detail": "You must be in a patrol to spin the wheel."}, status=400)
            
        # 3. Calculate odds
        # 3% for 1 pt, 0.1% for 3 pts, 96.9% for 0 pts
        r = random.random()
        if r < 0.001:
            points = 3
        elif r < 0.031:
            points = 1
        else:
            points = 0
            
        # 4. Record spin
        WheelSpin.objects.create(user=request.user, group=group, points_won=points)
            
        return Response({"points": points})

class WheelRecentWinnersView(APIView):
    def get(self, request):
        winners = WheelSpin.objects.filter(points_won__gt=0).order_by('-created_at')[:5]
        data = []
        for w in winners:
            data.append({
                'username': w.user.username,
                'points': w.points_won,
                'group_name': w.group.name if w.group else 'No Patrol',
                'time_ago': w.created_at.strftime('%b %d, %H:%M')
            })
        return Response(data)

class TimelineView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_date_str = request.query_params.get('start_date')
        if not start_date_str:
            start_date = timezone.now().date()
        else:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            
        groups = ScoutGroup.objects.all()
        group_data = []
        for g in groups:
            group_data.append({
                'id': g.id,
                'name': g.name,
                'avatar': request.build_absolute_uri(g.profile_picture.url) if g.profile_picture else None,
                'theme_color': g.theme_color
            })
            
        today = timezone.now().date()
        if today < start_date:
            days_diff = 0
        else:
            days_diff = (today - start_date).days
            
        rounds = []
        cumulative_points = {g.id: 0 for g in groups}
        
        for i in range(days_diff + 1):
            current_date = start_date + timedelta(days=i)
            if i == 0:
                start_dt = timezone.make_aware(datetime.combine(current_date, time(14, 0)))
                end_dt = timezone.make_aware(datetime.combine(current_date, time(23, 59, 59, 999999)))
            else:
                start_dt = timezone.make_aware(datetime.combine(current_date, time(0, 0)))
                end_dt = timezone.make_aware(datetime.combine(current_date, time(23, 59, 59, 999999)))
                
            round_points = {g.id: 0 for g in groups}
            
            scores = GameScore.objects.filter(created_at__gte=start_dt, created_at__lte=end_dt)
            for s in scores:
                round_points[s.group_id] += s.points
                
            spins = WheelSpin.objects.filter(created_at__gte=start_dt, created_at__lte=end_dt)
            for s in spins:
                if s.group_id:
                    round_points[s.group_id] += s.points_won
                    
            for gid in cumulative_points:
                cumulative_points[gid] += round_points.get(gid, 0)
                
            rounds.append({
                'round_index': i + 1,
                'date': current_date.strftime('%Y-%m-%d'),
                'round_points': round_points.copy(),
                'cumulative_points': cumulative_points.copy()
            })
            
        return Response({
            'groups': group_data,
            'rounds': rounds
        })

