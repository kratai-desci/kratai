"""
URL to View Mapping Fixture (Django urls.py)

MUST detect:
- URL patterns (path, re_path)
- Route → View relationships
- URL parameters (<int:id>, <slug:slug>)
- URL namespaces and app_name
"""

from django.urls import path, include
from . import views

app_name = 'users'

# MUST detect: Route /users/ → UserListView
# MUST detect: Route /users/<int:pk>/ → UserDetailView
# MUST detect: Route /users/create/ → UserCreateView
urlpatterns = [
    # Class-based views
    path('', views.UserListView.as_view(), name='user-list'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('create/', views.UserCreateView.as_view(), name='user-create'),
    
    # Function-based views
    path('<int:user_id>/delete/', views.delete_user, name='user-delete'),
    path('<int:user_id>/activate/', views.activate_user, name='user-activate'),
    
    # Nested routes
    path('<int:user_id>/posts/', include('posts.urls')),
]

# API URLs (Django REST Framework)
# MUST detect: Route /api/users/ → UserViewSet
api_patterns = [
    path('users/', views.UserViewSet.as_view({'get': 'list', 'post': 'create'}), name='api-user-list'),
    path('users/<int:pk>/', views.UserViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'delete': 'destroy'
    }), name='api-user-detail'),
]
