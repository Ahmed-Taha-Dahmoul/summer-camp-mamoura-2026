from rest_framework import serializers
from .models import Post, Comment
from accounts.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_profile_picture = serializers.ImageField(source='author.profile_picture', read_only=True)

    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ('author',)

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_profile_picture = serializers.ImageField(source='author.profile_picture', read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ('author',)
