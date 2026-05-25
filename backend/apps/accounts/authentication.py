from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import Profile


class LocalTokenAuthentication(TokenAuthentication):
    """DRF token auth that resolves to the practitioner's `Profile` rather
    than the underlying Django `User`, so `request.user` keeps working as a
    `Profile` everywhere it's used as a FK target (created_by, practitioner,
    generated_by, uploaded_by, changed_by...)."""

    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        try:
            profile = user.profile
        except Profile.DoesNotExist as exc:
            raise AuthenticationFailed("Aucun profil praticien associé à ce compte.") from exc
        return (profile, token)
