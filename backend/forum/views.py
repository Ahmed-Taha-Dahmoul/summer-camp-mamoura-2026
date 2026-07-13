from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Post, Comment, ForumReaction
from .serializers import PostSerializer, CommentSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
        
    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        post = self.get_object()
        reaction_type = request.data.get('type', 'HEART')
        
        if reaction_type not in ['HEART', 'LAUGH']:
            return Response({'error': 'Invalid reaction type'}, status=status.HTTP_400_BAD_REQUEST)
            
        reaction, created = ForumReaction.objects.get_or_create(
            post=post, user=request.user, 
            defaults={'reaction_type': reaction_type}
        )
        
        if not created:
            if reaction.reaction_type == reaction_type:
                # Toggle off
                reaction.delete()
                return Response({'status': 'unreacted', 'type': reaction_type})
            else:
                # Switch reaction type
                reaction.reaction_type = reaction_type
                reaction.save()
                return Response({'status': 'changed', 'type': reaction_type})
                
        return Response({'status': 'reacted', 'type': reaction_type})

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
