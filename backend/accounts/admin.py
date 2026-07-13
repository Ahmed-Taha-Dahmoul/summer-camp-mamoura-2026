from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, AdminInviteCode

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Scout App Profile', {
            'fields': ('role', 'gender', 'phone_number', 'profile_picture', 'bio'),
        }),
        ('Scout Privileges & Moderation', {
            'fields': ('unlimited_instants', 'moderated_groups'),
            'description': 'Manage special privileges like unlimited daily instants and group moderation access.',
        }),
    )
    filter_horizontal = ('moderated_groups',)

class AdminInviteCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'role_type', 'gender', 'is_used', 'created_at')
    list_filter = ('role_type', 'gender', 'is_used')

admin.site.register(User, CustomUserAdmin)
admin.site.register(AdminInviteCode, AdminInviteCodeAdmin)
