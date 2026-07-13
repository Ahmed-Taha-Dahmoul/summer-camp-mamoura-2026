from rest_framework import serializers
from .models import Post, Comment
from accounts.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_profile_picture = serializers.ImageField(source='author.profile_picture', read_only=True)
    author_full_name = serializers.SerializerMethodField()
    author_patrol_name = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()
    author_patrol_theme_color = serializers.SerializerMethodField()
    author_patrol_avatar_preset = serializers.SerializerMethodField()
    author_patrol_banner_preset = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ('author',)

    def get_author_full_name(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username

    def _get_group(self, author):
        if hasattr(author, 'profile') and author.profile.scout_group:
            return author.profile.scout_group
        elif hasattr(author, 'led_group'):
            return author.led_group
        return None

    def get_author_patrol_name(self, obj):
        group = self._get_group(obj.author)
        return group.name if group else "No Patrol"

    def get_author_patrol_theme_color(self, obj):
        group = self._get_group(obj.author)
        return group.theme_color if group else 'blue'

    def get_author_patrol_avatar_preset(self, obj):
        group = self._get_group(obj.author)
        return group.avatar_preset if group else 'tent'

    def get_author_patrol_banner_preset(self, obj):
        group = self._get_group(obj.author)
        return group.banner_preset if group else 'forest'

    def get_author_role(self, obj):
        if hasattr(obj.author, 'profile'):
            return obj.author.profile.get_group_role_display() or obj.author.profile.group_role
        elif hasattr(obj.author, 'led_group'):
            return "عميدة (Amiida)" if obj.author.gender == 'GIRL' else "عميد (Amiid)"
        return "Unknown"

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_profile_picture = serializers.ImageField(source='author.profile_picture', read_only=True)
    author_full_name = serializers.SerializerMethodField()
    author_patrol_name = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()
    author_patrol_theme_color = serializers.SerializerMethodField()
    author_patrol_avatar_preset = serializers.SerializerMethodField()
    author_patrol_banner_preset = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    reactions = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ('author',)

    def get_author_full_name(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username

    def _get_group(self, author):
        if hasattr(author, 'profile') and author.profile.scout_group:
            return author.profile.scout_group
        elif hasattr(author, 'led_group'):
            return author.led_group
        return None

    def get_author_patrol_name(self, obj):
        group = self._get_group(obj.author)
        return group.name if group else "No Patrol"

    def get_author_patrol_theme_color(self, obj):
        group = self._get_group(obj.author)
        return group.theme_color if group else 'blue'

    def get_author_patrol_avatar_preset(self, obj):
        group = self._get_group(obj.author)
        return group.avatar_preset if group else 'tent'

    def get_author_patrol_banner_preset(self, obj):
        group = self._get_group(obj.author)
        return group.banner_preset if group else 'forest'

    def get_author_role(self, obj):
        if hasattr(obj.author, 'profile'):
            return obj.author.profile.get_group_role_display() or obj.author.profile.group_role
        elif hasattr(obj.author, 'led_group'):
            return "عميدة (Amiida)" if obj.author.gender == 'GIRL' else "عميد (Amiid)"
        return "Unknown"

    def get_reactions(self, obj):
        request = self.context.get('request')
        reactors = []
        user_reaction_type = None
        
        for reaction in obj.reactions.select_related('user').all():
            user = reaction.user
            reactors.append({
                'id': user.id,
                'username': user.username,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'profile_picture': request.build_absolute_uri(user.profile_picture.url) if user.profile_picture and request else (user.profile_picture.url if user.profile_picture else None),
                'type': reaction.reaction_type
            })
            if request and request.user.id == user.id:
                user_reaction_type = reaction.reaction_type
                
        return {
            'count': len(reactors),
            'user_reaction_type': user_reaction_type,
            'reactors': reactors
        }
