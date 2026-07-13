from django.urls import path
from . import views

urlpatterns = [
    path('', views.InstantaneListView.as_view(), name='instantane-list'),
    path('unread_count/', views.InstantaneUnreadCountView.as_view(), name='instantane-unread-count'),
    path('me/', views.MyInstantsListView.as_view(), name='instantane-me'),
    path('<int:pk>/react/', views.InstantaneReactView.as_view(), name='instantane-react'),
    path('<int:pk>/view/', views.InstantaneMarkViewed.as_view(), name='instantane-view'),
    path('moderation/', views.ModerationListView.as_view(), name='instantane-moderation-list'),
    path('moderation/<int:pk>/', views.ModerationDeleteView.as_view(), name='instantane-moderation-delete'),
]
