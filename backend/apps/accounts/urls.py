from django.urls import path

from .views import change_password, login, logout, me

urlpatterns = [
    path("auth/login/", login, name="login"),
    path("auth/logout/", logout, name="logout"),
    path("auth/change-password/", change_password, name="change-password"),
    path("me/", me, name="me"),
]
