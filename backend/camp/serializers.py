from rest_framework import serializers
from .models import ScoutGroup, ScoutProfile, InviteCode, Badge, EarnedBadge
from accounts.serializers import UserSerializer

class ScoutProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    scout_group_name = serializers.ReadOnlyField(source='scout_group.name')

    class Meta:
        model = ScoutProfile
        fields = '__all__'

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = '__all__'

class EarnedBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = EarnedBadge
        fields = ['id', 'badge', 'earned_at']

class ScoutGroupSerializer(serializers.ModelSerializer):
    leader_name = serializers.ReadOnlyField(source='leader.username')
    members = ScoutProfileSerializer(many=True, read_only=True)
    amiid_details = UserSerializer(source='leader', read_only=True)
    total_xp = serializers.ReadOnlyField()
    level = serializers.ReadOnlyField()
    earned_badges = EarnedBadgeSerializer(many=True, read_only=True)

    class Meta:
        model = ScoutGroup
        fields = '__all__'
        read_only_fields = ('leader',)


class InviteCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = InviteCode
        fields = '__all__'
        read_only_fields = ('code', 'group', 'is_used')

from .models import PianoScore
class PianoScoreSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = PianoScore
        fields = ['id', 'username', 'profile_picture', 'score', 'created_at']

    def get_profile_picture(self, obj):
        try:
            if obj.user.profile_picture:
                return obj.user.profile_picture.url
        except:
            pass
        return None

