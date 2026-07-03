from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ScoutGroupViewSet, ScoutProfileViewSet, InviteCodeViewSet, LeaderboardView

router = DefaultRouter()
router.register(r'groups', ScoutGroupViewSet)
router.register(r'profiles', ScoutProfileViewSet)
router.register(r'invite-codes', InviteCodeViewSet, basename='invitecode')

urlpatterns = [
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('', include(router.urls)),
]
