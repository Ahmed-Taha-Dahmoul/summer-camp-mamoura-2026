from rest_framework import serializers
from .models import InstantanePost, InstantaneReaction
from accounts.serializers import UserSerializer
from django.db.models import Count

class InstantaneReactionDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = InstantaneReaction
        fields = ('user', 'emoji', 'created_at')

class InstantanePostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    author_name = serializers.ReadOnlyField(source='user.username')
    author_profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True)
    author_full_name = serializers.SerializerMethodField()
    author_patrol_name = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()
    author_patrol_theme_color = serializers.SerializerMethodField()
    author_patrol_avatar_preset = serializers.SerializerMethodField()
    my_reaction = serializers.SerializerMethodField()
    reactions_summary = serializers.SerializerMethodField()
    detailed_reactions = InstantaneReactionDetailSerializer(source='reactions', many=True, read_only=True)

    class Meta:
        model = InstantanePost
        fields = ('id', 'user', 'image', 'created_at', 'my_reaction', 'reactions_summary', 'detailed_reactions',
                  'author_name', 'author_profile_picture', 'author_full_name', 'author_patrol_name', 
                  'author_role', 'author_patrol_theme_color', 'author_patrol_avatar_preset')
        read_only_fields = ('user', 'created_at')

    def get_author_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

    def _get_group(self, user):
        if hasattr(user, 'profile') and user.profile.scout_group:
            return user.profile.scout_group
        elif hasattr(user, 'led_group'):
            return user.led_group
        return None

    def get_author_patrol_name(self, obj):
        group = self._get_group(obj.user)
        return group.name if group else "No Patrol"

    def get_author_patrol_theme_color(self, obj):
        group = self._get_group(obj.user)
        return group.theme_color if group else 'blue'

    def get_author_patrol_avatar_preset(self, obj):
        group = self._get_group(obj.user)
        return group.avatar_preset if group else 'tent'

    def get_author_role(self, obj):
        if hasattr(obj.user, 'profile'):
            return obj.user.profile.get_group_role_display() or obj.user.profile.group_role
        elif hasattr(obj.user, 'led_group'):
            return "عميدة (Amiida)" if obj.user.gender == 'GIRL' else "عميد (Amiid)"
        return "Unknown"

    def get_my_reaction(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reaction = obj.reactions.filter(user=request.user).first()
            if reaction:
                return reaction.emoji
        return None

    def get_reactions_summary(self, obj):
        summary = obj.reactions.values('emoji').annotate(count=Count('emoji'))
        return {item['emoji']: item['count'] for item in summary}
