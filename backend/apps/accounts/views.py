from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import LoginSerializer, ProfileSerializer


@api_view(["GET"])
def me(request):
    """Returns the profile of the currently authenticated practitioner
    (resolved from the token by LocalTokenAuthentication)."""
    return Response(ProfileSerializer(request.user).data)


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
