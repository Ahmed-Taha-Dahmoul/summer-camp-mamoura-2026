from django.contrib import admin
from .models import ScoutGroup, ScoutProfile, InviteCode, Game, GameScore

class GameScoreInline(admin.TabularInline):
    model = GameScore
    extra = 1

class ScoutGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'leader', 'created_at')
    inlines = [GameScoreInline]

class GameAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'is_daily_instantane', 'is_wheel_spinner', 'active_since')
    list_editable = ('order', 'is_daily_instantane', 'is_wheel_spinner')

admin.site.register(ScoutGroup, ScoutGroupAdmin)
admin.site.register(ScoutProfile)
admin.site.register(InviteCode)
admin.site.register(Game, GameAdmin)
admin.site.register(GameScore)
