"""
Django REST Framework Permissions Fixture

MUST detect:
- Permission classes
- View → Permission relationships
- Custom permission logic
"""

from rest_framework import permissions

# MUST detect: Permission IsOwnerOrReadOnly
class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners to edit objects
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for any request (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for owner
        return obj.author == request.user


# MUST detect: Permission IsAdminOrReadOnly
class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission to allow admin users to edit, others read-only
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user and request.user.is_staff


# MUST detect: Permission CanManageUsers
class CanManageUsers(permissions.BasePermission):
    """
    Permission to manage users
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.has_perm('users.manage_user')


# MUST detect: Permission IsPostAuthor
class IsPostAuthor(permissions.BasePermission):
    """
    Permission to check if user is post author
    """
    
    def has_object_permission(self, request, view, obj):
        # Assume obj is a Post
        return obj.author == request.user
