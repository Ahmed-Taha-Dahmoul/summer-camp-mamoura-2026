from django.urls import path
from . import views

urlpatterns = [
    path('', views.InstantaneListView.as_view(), name='instantane-list'),
    path('<int:pk>/react/', views.InstantaneReactView.as_view(), name='instantane-react'),
]
