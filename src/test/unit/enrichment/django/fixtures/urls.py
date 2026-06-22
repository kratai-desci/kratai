"""
Django URL Configuration for testing
"""
from django.urls import path, include
from . import views

urlpatterns = [
    # Basic URL patterns
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('posts/', views.PostListView.as_view(), name='post-list'),
    path('posts/<slug:slug>/', views.PostDetailView.as_view(), name='post-detail'),
    
    # Function-based views
    path('api/users/', views.list_users_api, name='api-user-list'),
    path('api/posts/', views.list_posts_api, name='api-post-list'),
    
    # Nested routes
    path('api/', include([
        path('v1/users/', views.UserViewSet.as_view({'get': 'list'}), name='api-v1-users'),
        path('v1/posts/', views.PostViewSet.as_view({'get': 'list'}), name='api-v1-posts'),
    ])),
    
    # Dynamic parameters with different types
    path('categories/<str:name>/', views.category_detail, name='category-detail'),
    path('archive/<int:year>/<int:month>/', views.archive_view, name='archive'),
    path('profile/<uuid:user_id>/', views.profile_view, name='profile'),
]
