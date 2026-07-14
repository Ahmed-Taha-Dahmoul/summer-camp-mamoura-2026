from django.contrib import admin
from .models import InstantanePost, InstantaneReaction, InstantaneView


class InstantaneReactionInline(admin.TabularInline):
    model = InstantaneReaction
    extra = 0
    readonly_fields = ('user', 'emoji', 'created_at')


class InstantaneViewInline(admin.TabularInline):
    model = InstantaneView
    extra = 0
    readonly_fields = ('user', 'viewed_at')


@admin.register(InstantanePost)
class InstantanePostAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'image_preview', 'reaction_count', 'view_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username',)
    readonly_fields = ('created_at',)
    inlines = [InstantaneReactionInline, InstantaneViewInline]

    def image_preview(self, obj):
        if obj.image:
            return f'✅ {obj.image.name.split("/")[-1]}'
        return '—'
    image_preview.short_description = 'Image'

    def reaction_count(self, obj):
        return obj.reactions.count()
    reaction_count.short_description = 'Reactions'

    def view_count(self, obj):
        return obj.views.count()
    view_count.short_description = 'Views'


@admin.register(InstantaneReaction)
class InstantaneReactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'emoji', 'created_at')
    list_filter = ('emoji', 'created_at')
    search_fields = ('user__username',)
    readonly_fields = ('created_at',)


@admin.register(InstantaneView)
class InstantaneViewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'viewed_at')
    list_filter = ('viewed_at',)
    search_fields = ('user__username',)
    readonly_fields = ('viewed_at',)
