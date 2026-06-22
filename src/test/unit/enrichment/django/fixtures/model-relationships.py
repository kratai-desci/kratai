"""
Django Model Relationships Fixture (ORM)

MUST detect:
- Models (Django ORM)
- ForeignKey relationships (many-to-one)
- ManyToManyField relationships
- OneToOneField relationships
- Model → Model relationships
"""

from django.db import models
from django.contrib.auth.models import AbstractUser

# MUST detect: Model User
class User(AbstractUser):
    """User model with relationships"""
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # MUST detect: User → Profile (OneToOne relationship)
    # Note: Reverse relationship, Profile.user
    
    def __str__(self):
        return self.username


# MUST detect: Model Profile
# MUST detect: Profile → User (belongs-to, OneToOne)
class Profile(models.Model):
    """User profile with one-to-one relationship"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    def __str__(self):
        return f"Profile of {self.user.username}"


# MUST detect: Model Post
# MUST detect: Post → User (belongs-to, ForeignKey)
class Post(models.Model):
    """Post model with foreign key to User"""
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # MUST detect: Post → Category (ManyToMany)
    categories = models.ManyToManyField('Category', related_name='posts')
    
    # MUST detect: Post → Tag (ManyToMany)
    tags = models.ManyToManyField('Tag', through='PostTag', related_name='posts')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


# MUST detect: Model Category
# MUST detect: Category → Post (has-many, reverse of ManyToMany)
class Category(models.Model):
    """Category for posts"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    
    def __str__(self):
        return self.name


# MUST detect: Model Tag
class Tag(models.Model):
    """Tag for posts"""
    name = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return self.name


# MUST detect: Model PostTag (through table for ManyToMany)
# MUST detect: PostTag → Post (belongs-to)
# MUST detect: PostTag → Tag (belongs-to)
class PostTag(models.Model):
    """Through model for Post-Tag relationship with extra fields"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('post', 'tag')


# MUST detect: Model Comment
# MUST detect: Comment → Post (belongs-to)
# MUST detect: Comment → User (belongs-to)
# MUST detect: Comment → Comment (self-referential, parent)
class Comment(models.Model):
    """Comment model with self-referential relationship"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title}"
