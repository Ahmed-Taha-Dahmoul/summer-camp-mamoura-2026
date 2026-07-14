from django.contrib import admin
from .models import Post, Comment, ForumReaction


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    readonly_fields = ('author', 'created_at')


class ForumReactionInline(admin.TabularInline):
    model = ForumReaction
    extra = 0
    readonly_fields = ('user', 'reaction_type', 'created_at')


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'group', 'short_content', 'has_image', 'comment_count', 'reaction_count', 'created_at')
    list_filter = ('group', 'created_at')
    search_fields = ('author__username', 'content')
    readonly_fields = ('created_at',)
    inlines = [CommentInline, ForumReactionInline]

    def short_content(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content
    short_content.short_description = 'Content'

    def has_image(self, obj):
        return bool(obj.image)
    has_image.boolean = True
    has_image.short_description = 'Image?'

    def comment_count(self, obj):
        return obj.comments.count()
    comment_count.short_description = 'Comments'

    def reaction_count(self, obj):
        return obj.reactions.count()
    reaction_count.short_description = 'Reactions'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'post', 'short_content', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('author__username', 'content')
    readonly_fields = ('created_at',)

    def short_content(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content
    short_content.short_description = 'Content'


@admin.register(ForumReaction)
class ForumReactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'reaction_type', 'created_at')
    list_filter = ('reaction_type', 'created_at')
    search_fields = ('user__username',)
    readonly_fields = ('created_at',)
