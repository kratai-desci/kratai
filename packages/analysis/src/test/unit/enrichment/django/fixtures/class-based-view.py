"""
Django Class-Based Views Fixture

MUST detect:
- Class-based views (ListView, DetailView, CreateView, etc.)
- View → Model relationships
- View → Serializer relationships (DRF)
- ViewSets (DRF)
- Permissions and authentication
"""

from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, Post, Category
from .serializers import UserSerializer, PostSerializer, CategorySerializer

# ===== Django Generic Views =====

# MUST detect: View UserListView
# MUST detect: UserListView → User (uses model)
class UserListView(LoginRequiredMixin, ListView):
    """List all users"""
    model = User
    template_name = 'users/user_list.html'
    context_object_name = 'users'
    paginate_by = 20
    
    def get_queryset(self):
        return User.objects.select_related('profile').all()


# MUST detect: View UserDetailView
# MUST detect: UserDetailView → User (uses model)
class UserDetailView(DetailView):
    """Display user detail"""
    model = User
    template_name = 'users/user_detail.html'
    context_object_name = 'user'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # MUST detect: UserDetailView → Post (queries related model)
        context['posts'] = self.object.posts.all()[:5]
        return context


# MUST detect: View UserCreateView
# MUST detect: UserCreateView → User (creates model)
class UserCreateView(PermissionRequiredMixin, CreateView):
    """Create new user"""
    model = User
    template_name = 'users/user_form.html'
    fields = ['username', 'email', 'first_name', 'last_name']
    permission_required = 'users.add_user'
    
    def form_valid(self, form):
        response = super().form_valid(form)
        # Additional logic after user creation
        return response


# MUST detect: View PostListView
# MUST detect: PostListView → Post (uses model)
class PostListView(ListView):
    """List posts with filtering"""
    model = Post
    template_name = 'posts/post_list.html'
    context_object_name = 'posts'
    paginate_by = 10
    
    def get_queryset(self):
        queryset = Post.objects.select_related('author').prefetch_related('categories')
        
        # Filter by category
        category = self.request.GET.get('category')
        if category:
            queryset = queryset.filter(categories__slug=category)
        
        return queryset


# ===== Django REST Framework ViewSets =====

# MUST detect: ViewSet UserViewSet
# MUST detect: UserViewSet → User (model)
# MUST detect: UserViewSet → UserSerializer (serializer_class)
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User operations
    Provides: list, create, retrieve, update, destroy
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username']
    
    # MUST detect: Custom action
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate user"""
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'status': 'user activated'})
    
    # MUST detect: Custom action
    @action(detail=True, methods=['get'])
    def posts(self, request, pk=None):
        """Get user's posts"""
        user = self.get_object()
        # MUST detect: UserViewSet → PostSerializer (uses)
        posts = user.posts.all()
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)


# MUST detect: ViewSet PostViewSet
# MUST detect: PostViewSet → Post (model)
# MUST detect: PostViewSet → PostSerializer (serializer_class)
class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Post operations
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Filter posts by category or author"""
        queryset = Post.objects.select_related('author').prefetch_related('categories', 'tags')
        
        category = self.request.query_params.get('category', None)
        if category:
            # MUST detect: PostViewSet → Category (queries)
            queryset = queryset.filter(categories__slug=category)
        
        author = self.request.query_params.get('author', None)
        if author:
            queryset = queryset.filter(author__username=author)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set author to current user"""
        serializer.save(author=self.request.user)


# MUST detect: ViewSet with custom permissions
# MUST detect: CategoryViewSet → Category (model)
# MUST detect: CategoryViewSet → CategorySerializer (serializer_class)
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Category (read-only)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    
    @action(detail=True, methods=['get'])
    def posts(self, request, slug=None):
        """Get posts in this category"""
        category = self.get_object()
        # MUST detect: CategoryViewSet → Post (queries)
        posts = category.posts.all()
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)
