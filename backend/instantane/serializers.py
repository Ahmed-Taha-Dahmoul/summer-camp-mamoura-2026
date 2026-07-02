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
    my_reaction = serializers.SerializerMethodField()
    reactions_summary = serializers.SerializerMethodField()
    detailed_reactions = InstantaneReactionDetailSerializer(source='reactions', many=True, read_only=True)

    class Meta:
        model = InstantanePost
        fields = ('id', 'user', 'image', 'created_at', 'my_reaction', 'reactions_summary', 'detailed_reactions')
        read_only_fields = ('user', 'created_at')

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
