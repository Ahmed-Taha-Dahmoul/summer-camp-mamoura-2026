from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import ScoutGroup, ScoutProfile, InviteCode, Game, GameScore
from .serializers import ScoutGroupSerializer, ScoutProfileSerializer, InviteCodeSerializer
from rest_framework.exceptions import PermissionDenied

class IsArifOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == 'ARIF'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.leader == request.user

class ScoutGroupViewSet(viewsets.ModelViewSet):
    queryset = ScoutGroup.objects.all()
    serializer_class = ScoutGroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsArifOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        if self.request.user.role != 'ARIF':
            raise PermissionDenied("Only Arifs can create groups.")
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
    permission_classes = [permissions.IsAuthenticated, IsArifOrReadOnly]

    def get_queryset(self):
        # Arifs only see their own group's codes
        if self.request.user.role == 'ARIF':
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
        groups = ScoutGroup.objects.all()
        
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
                'group_banner': request.build_absolute_uri(group.banner.url) if group.banner else None,
                'group_profile': request.build_absolute_uri(group.profile_picture.url) if group.profile_picture else None,
                'scores': group_scores,
                'total_score': total,
            })
            
        # Sort descending by total score
        leaderboard.sort(key=lambda x: x['total_score'], reverse=True)
        
        games_data = [{'id': g.id, 'name': g.name} for g in games]
        
        return Response({
            'games': games_data,
            'leaderboard': leaderboard
        })
