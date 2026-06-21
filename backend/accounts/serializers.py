from rest_framework import serializers
from .models import User, AdminInviteCode
from camp.models import InviteCode, ScoutProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'phone_number', 'profile_picture', 'bio')
        read_only_fields = ('id', 'username', 'role')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    invite_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'first_name', 'last_name', 'invite_code')

    def validate(self, data):
        role = data.get('role', 'SCOUT')
        invite_code = data.get('invite_code')
        
        if not invite_code:
            raise serializers.ValidationError({"invite_code": f"Invite code is required for {role.lower()} registration."})
            
        if role == 'LEADER':
            try:
                code_obj = AdminInviteCode.objects.get(code=invite_code, role_type='LEADER', is_used=False)
                data['admin_invite_code_obj'] = code_obj
            except AdminInviteCode.DoesNotExist:
                raise serializers.ValidationError({"invite_code": "Invalid or already used Leader invite code."})
        elif role in ['SCOUT', 'ARIF']:
            # Auto-detect if this is an ARIF code or a SCOUT code
            try:
                code_obj = AdminInviteCode.objects.get(code=invite_code, role_type='ARIF', is_used=False)
                data['admin_invite_code_obj'] = code_obj
                data['role'] = 'ARIF'
            except AdminInviteCode.DoesNotExist:
                try:
                    code_obj = InviteCode.objects.get(code=invite_code, is_used=False)
                    data['invite_code_obj'] = code_obj
                    data['role'] = 'SCOUT'
                except InviteCode.DoesNotExist:
                    raise serializers.ValidationError({"invite_code": "Invalid or already used Scout/Arif invite code."})
        
        return data

    def create(self, validated_data):
        invite_code_obj = validated_data.pop('invite_code_obj', None)
        admin_invite_code_obj = validated_data.pop('admin_invite_code_obj', None)
        validated_data.pop('invite_code', None)

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'SCOUT'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )

        if user.role in ['LEADER', 'ARIF'] and admin_invite_code_obj:
            admin_invite_code_obj.is_used = True
            admin_invite_code_obj.save()
        elif user.role == 'SCOUT' and invite_code_obj:
            # Create profile and link group
            ScoutProfile.objects.create(user=user, scout_group=invite_code_obj.group)
            invite_code_obj.is_used = True
            invite_code_obj.save()

        return user
