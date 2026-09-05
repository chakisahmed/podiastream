from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import ChangePasswordSerializer, LoginSerializer, ProfileSerializer


@api_view(["GET", "PATCH"])
def me(request):
    """Returns, or updates, the profile of the currently authenticated
    practitioner (implicitly resolved via LocalTokenAuthentication)."""
    if request.method == "PATCH":
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(ProfileSerializer(request.user).data)


@api_view(["POST"])
def change_password(request):
    payload = ChangePasswordSerializer(data=request.data)
    payload.is_valid(raise_exception=True)

    user = request.user.user
    if not user.check_password(payload.validated_data["old_password"]):
        return Response(
            {"detail": "Mot de passe actuel incorrect."}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        validate_password(payload.validated_data["new_password"], user=user)
    except DjangoValidationError as exc:
        raise ValidationError({"new_password": exc.messages}) from exc

    user.set_password(payload.validated_data["new_password"])
    user.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    payload = LoginSerializer(data=request.data)
    payload.is_valid(raise_exception=True)

    user = authenticate(
        request,
        username=payload.validated_data["email"],
        password=payload.validated_data["password"],
    )
    if user is None:
        return Response(
            {"detail": "Email ou mot de passe incorrect."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        profile = user.profile
    except Exception:
        return Response(
            {"detail": "Aucun profil praticien associé à ce compte."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "profile": ProfileSerializer(profile).data})


@api_view(["POST"])
def logout(request):
    request.auth.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
