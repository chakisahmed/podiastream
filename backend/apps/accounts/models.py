import uuid

from django.conf import settings
from django.db import models


class Profile(models.Model):
    """Cabinet-specific data for a local Django user account."""

    class Role(models.TextChoices):
        PODOLOGUE = "podologue", "Podologue"
        ASSISTANT = "assistant", "Assistant(e)"
        ADMIN = "admin", "Administrateur"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PODOLOGUE)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "profiles"

    def __str__(self):
        return self.full_name

    @property
    def is_authenticated(self):
        """Always True: existence of a Profile means the token already
        verified. Satisfies DRF's IsAuthenticated permission check, which
        expects this attribute from `request.user`."""
        return True
