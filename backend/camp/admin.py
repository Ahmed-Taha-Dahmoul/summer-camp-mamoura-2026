from django.contrib import admin
from .models import ScoutGroup, ScoutProfile, InviteCode, Game, GameScore, WheelSpin, Badge, EarnedBadge


class GameScoreInline(admin.TabularInline):
    model = GameScore
    extra = 1


class EarnedBadgeInline(admin.TabularInline):
    model = EarnedBadge
    extra = 0
    readonly_fields = ('earned_at',)


class ScoutGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'leader', 'total_xp', 'level', 'created_at')
    inlines = [GameScoreInline, EarnedBadgeInline]

    def total_xp(self, obj):
        return obj.total_xp
    total_xp.short_description = 'Total XP'

    def level(self, obj):
        return obj.level
    level.short_description = 'Level'


class GameAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'is_daily_instantane', 'is_wheel_spinner', 'active_since')
    list_editable = ('order', 'is_daily_instantane', 'is_wheel_spinner')


@admin.register(WheelSpin)
class WheelSpinAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'group', 'points_won', 'created_at')
    list_filter = ('group', 'points_won', 'created_at')
    search_fields = ('user__username',)
    readonly_fields = ('created_at',)


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon_name', 'icon_color_class', 'times_earned', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at',)

    def times_earned(self, obj):
        return obj.earned_by.count()
    times_earned.short_description = 'Times Earned'


@admin.register(EarnedBadge)
class EarnedBadgeAdmin(admin.ModelAdmin):
    list_display = ('id', 'group', 'badge', 'earned_at')
    list_filter = ('badge', 'group')
    readonly_fields = ('earned_at',)


admin.site.register(ScoutGroup, ScoutGroupAdmin)
admin.site.register(ScoutProfile)
admin.site.register(InviteCode)
admin.site.register(Game, GameAdmin)
admin.site.register(GameScore)
