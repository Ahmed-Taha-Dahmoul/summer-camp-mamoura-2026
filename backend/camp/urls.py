from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ScoutGroupViewSet, ScoutProfileViewSet, InviteCodeViewSet

router = DefaultRouter()
router.register(r'groups', ScoutGroupViewSet)
router.register(r'profiles', ScoutProfileViewSet)
router.register(r'invite-codes', InviteCodeViewSet, basename='invitecode')

urlpatterns = [
    path('', include(router.urls)),
]
