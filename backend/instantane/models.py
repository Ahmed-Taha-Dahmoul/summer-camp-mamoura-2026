from django.db import models
from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image
from io import BytesIO
import sys

class InstantanePost(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='instantane_posts')
    image = models.ImageField(upload_to='instantane/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}'s Instantane on {self.created_at.date()}"

    def save(self, *args, **kwargs):
        if self.image and hasattr(self.image, 'read'):
            try:
                img = Image.open(self.image)

                # Auto-rotate based on EXIF orientation
                try:
                    from PIL import ExifTags
                    for orientation_key in ExifTags.TAGS.keys():
                        if ExifTags.TAGS[orientation_key] == 'Orientation':
                            break
                    exif = img._getexif()
                    if exif and orientation_key in exif:
                        orientation = exif[orientation_key]
                        if orientation == 3:
                            img = img.rotate(180, expand=True)
                        elif orientation == 6:
                            img = img.rotate(270, expand=True)
                        elif orientation == 8:
                            img = img.rotate(90, expand=True)
                except (AttributeError, KeyError, IndexError):
                    pass

                # Convert to RGB if necessary (e.g. PNG with alpha)
                if img.mode in ('RGBA', 'P', 'LA'):
                    img = img.convert('RGB')

                # Resize: max 1080px on the longest side
                max_size = 1080
                if img.width > max_size or img.height > max_size:
                    img.thumbnail((max_size, max_size), Image.LANCZOS)

                # Re-encode as optimized JPEG
                output = BytesIO()
                img.save(output, format='JPEG', quality=70, optimize=True)
                output.seek(0)

                # Replace the image field with the compressed version
                self.image = InMemoryUploadedFile(
                    output, 'ImageField',
                    f"{self.image.name.rsplit('.', 1)[0]}.jpg",
                    'image/jpeg',
                    sys.getsizeof(output),
                    None
                )
            except Exception:
                # If compression fails, save the original image as-is
                pass

        super().save(*args, **kwargs)

class InstantaneReaction(models.Model):
    post = models.ForeignKey(InstantanePost, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')

    def __str__(self):
        return f"{self.user.username} reacted {self.emoji} to {self.post}"

class InstantaneView(models.Model):
    post = models.ForeignKey(InstantanePost, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')

    def __str__(self):
        return f"{self.user.username} viewed {self.post}"
