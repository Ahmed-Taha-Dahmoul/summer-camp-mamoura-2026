from rest_framework import serializers
from .models import ScoutGroup, ScoutProfile, InviteCode
from accounts.serializers import UserSerializer

class ScoutProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    scout_group_name = serializers.ReadOnlyField(source='scout_group.name')

    class Meta:
        model = ScoutProfile
        fields = '__all__'

class ScoutGroupSerializer(serializers.ModelSerializer):
    leader_name = serializers.ReadOnlyField(source='leader.username')
    members = ScoutProfileSerializer(many=True, read_only=True)
    arif_details = UserSerializer(source='leader', read_only=True)

    class Meta:
        model = ScoutGroup
        fields = '__all__'
        read_only_fields = ('leader',)


class InviteCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = InviteCode
        fields = '__all__'
        read_only_fields = ('code', 'group', 'is_used')

