"""
Django REST Framework Serializer Fixture

MUST detect:
- Serializers (DRF)
- Serializer → Model relationships
- Nested serializers
- Model → Serializer transformation
"""

from rest_framework import serializers
from .models import User, Profile, Post, Category, Tag, Comment

# MUST detect: Serializer UserSerializer
# MUST detect: UserSerializer → User (serializes)
class UserSerializer(serializers.ModelSerializer):
    """User serializer with nested profile"""
    
    # MUST detect: UserSerializer → ProfileSerializer (nested)
    profile = serializers.SerializerMethodField()
    post_count = serializers.IntegerField(source='posts.count', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile', 'post_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_profile(self, obj):
        if hasattr(obj, 'profile'):
            return ProfileSerializer(obj.profile).data
        return None


# MUST detect: Serializer ProfileSerializer
# MUST detect: ProfileSerializer → Profile (serializes)
class ProfileSerializer(serializers.ModelSerializer):
    """Profile serializer"""
    
    class Meta:
        model = Profile
        fields = ['avatar', 'phone']


# MUST detect: Serializer PostSerializer
# MUST detect: PostSerializer → Post (serializes)
# MUST detect: PostSerializer → UserSerializer (nested author)
class PostSerializer(serializers.ModelSerializer):
    """Post serializer with nested relationships"""
    
    # MUST detect: Nested serializer usage
    author = UserSerializer(read_only=True)
    categories = serializers.StringRelatedField(many=True, read_only=True)
    tags = serializers.StringRelatedField(many=True, read_only=True)
    comment_count = serializers.IntegerField(source='comments.count', read_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'author', 'categories', 'tags', 'comment_count', 'created_at']
        read_only_fields = ['id', 'created_at']


# MUST detect: Serializer CategorySerializer
# MUST detect: CategorySerializer → Category (serializes)
class CategorySerializer(serializers.ModelSerializer):
    """Category serializer"""
    post_count = serializers.IntegerField(source='posts.count', read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'post_count']


# MUST detect: Serializer CommentSerializer
# MUST detect: CommentSerializer → Comment (serializes)
class CommentSerializer(serializers.ModelSerializer):
    """Comment serializer with nested author"""
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'parent', 'replies', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []


# MUST detect: Serializer for write operations
# MUST detect: PostCreateSerializer → Post (transforms)
class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts"""
    category_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Post
        fields = ['title', 'content', 'category_ids', 'tag_ids']
    
    def create(self, validated_data):
        category_ids = validated_data.pop('category_ids', [])
        tag_ids = validated_data.pop('tag_ids', [])
        
        post = Post.objects.create(**validated_data)
        post.categories.set(category_ids)
        post.tags.set(tag_ids)
        
        return post
