"""
Django Function-Based Views Fixture

MUST detect:
- Function-based views
- View → Model relationships
- Decorators (permissions, authentication)
- Request/response handling
"""

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required, permission_required
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods, require_POST, require_GET
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import User, Post, Comment
from .serializers import PostSerializer, CommentSerializer

# MUST detect: Function delete_user
# MUST detect: Uses @login_required decorator
# MUST detect: Uses @permission_required decorator
# MUST detect: delete_user → User (queries)
@login_required
@permission_required('users.delete_user', raise_exception=True)
@require_POST
def delete_user(request, user_id):
    """Delete user (function-based view)"""
    user = get_object_or_404(User, id=user_id)
    username = user.username
    user.delete()
    
    return JsonResponse({
        'status': 'success',
        'message': f'User {username} deleted'
    })


# MUST detect: Function activate_user
# MUST detect: activate_user → User (modifies)
@login_required
@require_POST
def activate_user(request, user_id):
    """Activate user account"""
    user = get_object_or_404(User, id=user_id)
    user.is_active = True
    user.save()
    
    return JsonResponse({
        'status': 'success',
        'user_id': user.id,
        'is_active': user.is_active
    })


# MUST detect: Function create_post
# MUST detect: create_post → Post (creates)
# MUST detect: create_post → Category (queries)
@login_required
@require_http_methods(['GET', 'POST'])
def create_post(request):
    """Create new post"""
    if request.method == 'POST':
        title = request.POST.get('title')
        content = request.POST.get('content')
        category_ids = request.POST.getlist('categories')
        
        # MUST detect: create_post → Post (creates model)
        post = Post.objects.create(
            title=title,
            content=content,
            author=request.user
        )
        
        # MUST detect: create_post → Category (queries)
        post.categories.set(category_ids)
        
        return redirect('post-detail', pk=post.id)
    
    # GET request - show form
    from .models import Category
    categories = Category.objects.all()
    return render(request, 'posts/create_post.html', {
        'categories': categories
    })


# MUST detect: Function get_user_posts
# MUST detect: get_user_posts → User (queries)
# MUST detect: get_user_posts → Post (queries)
@require_GET
def get_user_posts(request, user_id):
    """Get all posts by user (JSON response)"""
    user = get_object_or_404(User, id=user_id)
    posts = user.posts.all()
    
    data = {
        'user': {
            'id': user.id,
            'username': user.username
        },
        'posts': [
            {
                'id': post.id,
                'title': post.title,
                'created_at': post.created_at.isoformat()
            }
            for post in posts
        ]
    }
    
    return JsonResponse(data)


# ===== Django REST Framework Function-Based Views =====

# MUST detect: API view list_posts_api
# MUST detect: Uses @api_view decorator
# MUST detect: list_posts_api → Post (queries)
# MUST detect: list_posts_api → PostSerializer (serializes)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def list_posts_api(request):
    """
    List posts or create new post (DRF function-based)
    """
    if request.method == 'GET':
        posts = Post.objects.select_related('author').all()
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# MUST detect: API view post_detail_api
# MUST detect: post_detail_api → Post (queries)
# MUST detect: post_detail_api → PostSerializer (serializes)
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def post_detail_api(request, pk):
    """
    Get, update, or delete a post (DRF function-based)
    """
    post = get_object_or_404(Post, pk=pk)
    
    if request.method == 'GET':
        serializer = PostSerializer(post)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = PostSerializer(post, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# MUST detect: API view add_comment
# MUST detect: add_comment → Post (queries)
# MUST detect: add_comment → Comment (creates)
# MUST detect: add_comment → CommentSerializer (serializes)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_comment(request, post_id):
    """Add comment to post"""
    post = get_object_or_404(Post, id=post_id)
    
    serializer = CommentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(
            post=post,
            author=request.user
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# MUST detect: Function with multiple model interactions
# MUST detect: get_post_stats → Post (queries)
# MUST detect: get_post_stats → Comment (queries)
# MUST detect: get_post_stats → User (queries)
@api_view(['GET'])
def get_post_stats(request, post_id):
    """Get statistics for a post"""
    post = get_object_or_404(Post, id=post_id)
    
    stats = {
        'post_id': post.id,
        'title': post.title,
        'author': post.author.username,
        'comment_count': post.comments.count(),
        'category_count': post.categories.count(),
        'tag_count': post.tags.count(),
    }
    
    return Response(stats)
