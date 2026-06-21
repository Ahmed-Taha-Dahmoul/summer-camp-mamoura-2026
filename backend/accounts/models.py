from django.db import models
from django.contrib.auth.models import AbstractUser
import string
import random

def generate_admin_code():
    return 'ADM-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

class User(AbstractUser):
    ROLE_CHOICES = (
        ('LEADER', 'Scout Leader'),
        ('ARIF', 'Arif (Small Group Leader)'),
        ('SCOUT', 'Scout Member'),
        ('ADMIN', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='SCOUT')
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='user_profiles/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class AdminInviteCode(models.Model):
    ROLE_CHOICES = (
        ('LEADER', 'Scout Leader'),
        ('ARIF', 'Arif'),
    )
    code = models.CharField(max_length=12, unique=True, default=generate_admin_code)
    role_type = models.CharField(max_length=10, choices=ROLE_CHOICES, default='ARIF')
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.role_type} ({'Used' if self.is_used else 'Available'})"
