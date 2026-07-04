from rest_framework import serializers
from .models import Post, Comment
from accounts.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_profile_picture = serializers.ImageField(source='author.profile_picture', read_only=True)
    author_full_name = serializers.SerializerMethodField()
    author_patrol_name = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ('author',)

    def get_author_full_name(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username

    def get_author_patrol_name(self, obj):
        if hasattr(obj.author, 'profile') and obj.author.profile.scout_group:
            return obj.author.profile.scout_group.name
        elif hasattr(obj.author, 'led_group'):
            return obj.author.led_group.name
        return "No Patrol"

    def get_author_role(self, obj):
        if hasattr(obj.author, 'profile'):
            return obj.author.profile.get_group_role_display() or obj.author.profile.group_role
        elif hasattr(obj.author, 'led_group'):
            return "عريف (Arif)"
        return "Unknown"

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_profile_picture = serializers.ImageField(source='author.profile_picture', read_only=True)
    author_full_name = serializers.SerializerMethodField()
    author_patrol_name = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ('author',)

    def get_author_full_name(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username

    def get_author_patrol_name(self, obj):
        if hasattr(obj.author, 'profile') and obj.author.profile.scout_group:
            return obj.author.profile.scout_group.name
        elif hasattr(obj.author, 'led_group'):
            return obj.author.led_group.name
        return "No Patrol"

    def get_author_role(self, obj):
        if hasattr(obj.author, 'profile'):
            return obj.author.profile.get_group_role_display() or obj.author.profile.group_role
        elif hasattr(obj.author, 'led_group'):
            return "عريف (Arif)"
        return "Unknown"
