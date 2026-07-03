from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ScoutGroupViewSet, ScoutProfileViewSet, InviteCodeViewSet, LeaderboardView, WheelStatusView, SpinWheelView

router = DefaultRouter()
router.register(r'groups', ScoutGroupViewSet)
router.register(r'profiles', ScoutProfileViewSet)
router.register(r'invite-codes', InviteCodeViewSet, basename='invitecode')

urlpatterns = [
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('wheel-status/', WheelStatusView.as_view(), name='wheel-status'),
    path('spin-wheel/', SpinWheelView.as_view(), name='spin-wheel'),
    path('', include(router.urls)),
]
