from django.db import models
from django.conf import settings
import string
import random

def generate_invite_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

class ScoutGroup(models.Model):
    name = models.CharField(max_length=100)
    leader = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='led_group')
    banner = models.ImageField(upload_to='group_banners/', null=True, blank=True)
    profile_picture = models.ImageField(upload_to='group_profiles/', null=True, blank=True)
    theme_color = models.CharField(max_length=50, default='blue')
    avatar_preset = models.CharField(max_length=50, default='tent')
    banner_preset = models.CharField(max_length=50, default='forest')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ScoutProfile(models.Model):
    ROLE_CHOICES = (
        ('SECOND_LEADER', 'مساعد عريف'),
        ('WRITER', 'كاتب/مدون'),
        ('CHEF', 'طباخ'),
        ('SINGER', 'منشد'),
        ('MEMBER', 'عضو'),
    )
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    scout_group = models.ForeignKey(ScoutGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    group_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MEMBER')
    age = models.IntegerField(null=True, blank=True)
    bio = models.TextField(blank=True)

    def __str__(self):
        return f"Profile of {self.user.username}"

class InviteCode(models.Model):
    code = models.CharField(max_length=10, unique=True, default=generate_invite_code)
    group = models.ForeignKey(ScoutGroup, on_delete=models.CASCADE, related_name='invite_codes')
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code

