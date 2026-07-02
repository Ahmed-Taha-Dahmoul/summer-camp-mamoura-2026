from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import InstantanePost, InstantaneReaction, InstantaneView
from .serializers import InstantanePostSerializer
from django.utils import timezone
from django.db.models import Q

class InstantaneListView(generics.ListCreateAPIView):
    serializer_class = InstantanePostSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        today = timezone.now().date()
        return InstantanePost.objects.filter(created_at__date=today)\
                                     .exclude(views__user=self.request.user)\
                                     .exclude(user=self.request.user)\
                                     .order_by('created_at')

    def list(self, request, *args, **kwargs):
        today = timezone.now().date()
        my_post_qs = InstantanePost.objects.filter(user=request.user, created_at__date=today)
        has_posted = my_post_qs.exists()
        posts_today_count = my_post_qs.count()
        
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        my_post_data = self.get_serializer(my_post_qs.first()).data if has_posted else None
        
        has_moderation_access = request.user.moderated_groups.exists()
        
        return Response({
            "has_posted_today": has_posted,
            "posts_today_count": posts_today_count,
            "has_unlimited_instants": request.user.unlimited_instants,
            "has_moderation_access": has_moderation_access,
            "posts": serializer.data,
            "my_post": my_post_data
        })

    def create(self, request, *args, **kwargs):
        today = timezone.now().date()
        if not request.user.unlimited_instants and InstantanePost.objects.filter(user=request.user, created_at__date=today).count() >= 4:
            return Response({"detail": "You have reached the limit of 4 instantanes per day."}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class InstantaneReactView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        post = get_object_or_404(InstantanePost, pk=pk)
        emoji = request.data.get('emoji')
        
        if not emoji:
            return Response({"detail": "Emoji is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Toggle logic: if user sends the same emoji, remove it. Otherwise update/create.
        reaction = InstantaneReaction.objects.filter(post=post, user=request.user).first()
        if reaction and reaction.emoji == emoji:
            reaction.delete()
            return Response({"detail": "Reaction removed", "emoji": None}, status=status.HTTP_200_OK)
            
        reaction, created = InstantaneReaction.objects.update_or_create(
            post=post,
            user=request.user,
            defaults={'emoji': emoji}
        )
        return Response({"detail": "Reaction saved", "emoji": emoji}, status=status.HTTP_200_OK)

    def delete(self, request, pk, *args, **kwargs):
        post = get_object_or_404(InstantanePost, pk=pk)
        InstantaneReaction.objects.filter(post=post, user=request.user).delete()
        return Response({"detail": "Reaction removed"}, status=status.HTTP_204_NO_CONTENT)

class InstantaneMarkViewed(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        post = get_object_or_404(InstantanePost, pk=pk)
        InstantaneView.objects.get_or_create(post=post, user=request.user)
        return Response({"detail": "Marked as viewed"}, status=status.HTTP_200_OK)

class MyInstantsListView(generics.ListAPIView):
    serializer_class = InstantanePostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InstantanePost.objects.filter(user=self.request.user).order_by('created_at')

class ModerationListView(generics.ListAPIView):
    serializer_class = InstantanePostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        groups = self.request.user.moderated_groups.all()
        return InstantanePost.objects.filter(
            Q(user__profile__scout_group__in=groups) | Q(user__led_group__in=groups)
        ).distinct().order_by('-created_at')

class ModerationDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        groups = self.request.user.moderated_groups.all()
        return InstantanePost.objects.filter(
            Q(user__profile__scout_group__in=groups) | Q(user__led_group__in=groups)
        ).distinct()
