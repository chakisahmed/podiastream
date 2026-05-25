from django.urls import path

from .views import login, logout, me

urlpatterns = [
    path("auth/login/", login, name="login"),
    path("auth/logout/", logout, name="logout"),
    path("me/", me, name="me"),
]
