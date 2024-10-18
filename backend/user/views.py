from django.conf import settings

from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework import generics, filters
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend

from utils.generate_token import generate_token
from notification.emails import send_activation_email, send_email

from .permissions import IsSuperUser
from .models import User
from .serializers import (
    UserListSerializer,
    UserDetailSerializer,
    StaffListSerializer,
    StaffDetailSerializer,
    CreateStaffSerializer,
    DisableUserSerializer,
)


class UserListView(generics.ListAPIView):
    queryset = User.objects.filter(role="customer")
    serializer_class = UserListSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["email", "first_name", "last_name", "profile__phone_number"]
    filterset_fields = ["is_active"]


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.filter(role="customer")
    serializer_class = UserDetailSerializer
    permission_classes = [IsAdminUser]


class StaffListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.filter(is_staff=True, role="admin")
    serializer_class = StaffListSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["email", "first_name", "last_name", "profile__phone_number"]
    filterset_fields = ["is_active", "is_superuser"]

    def get_queryset(self):
        if self.request.method == "POST":
            return User.objects.all()
        return User.objects.filter(is_staff=True, role="admin")

    def get_permissions(self):
        if self.request.method == "POST":
            self.permission_classes = [IsSuperUser]
        else:
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateStaffSerializer
        return StaffListSerializer

    def perform_create(self, serializer):
        validated_data = serializer.validated_data
        if validated_data.get("is_superuser") and not self.request.user.is_superuser:
            raise ValidationError("You are not authorized to create a superuser.")

        user = serializer.save(is_staff=True, role="admin")

        # store token and save
        token = generate_token(length=100)
        user.token = token
        user.save()

        activation_url = f"{settings.FRONTEND_BASE_URL}/activate-account/?email={user.email}&token={token}"

        # Send activation email
        send_activation_email(user.email, activation_url)


class StaffDetailView(generics.RetrieveAPIView):
    queryset = User.objects.filter(is_staff=True, role="admin")
    serializer_class = StaffDetailSerializer


class DeactivateUserView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = DisableUserSerializer

    def get_queryset(self):
        if self.request.user.is_superuser:
            return User.objects.all()
        return User.objects.filter(is_staff=False, role="customer")

    def deactivate_user(self, user):
        subject = "Account Disabled"
        plain_message = f"Your account has been disabled by the admin.\nFor more information, please contact to admin at {settings.ADMIN_CONTACT_EMAIL}"
        html_content = f"<p>{plain_message}</p>"

        return subject, plain_message, html_content

    def activate_user(self, user):
        subject = "Account Activated"
        plain_message = f"Hello {user.first_name}, Welcome back to the platform.\nYour account has been activated by the admin."
        html_content = f"<p>{plain_message}</p>"

        return subject, plain_message, html_content

    def post(self, request, *args, **kwargs):
        user = self.get_queryset().get(pk=kwargs.get("pk"))

        if user.is_superuser or (user.is_staff and request.user.is_staff):
            raise ValidationError("You are not authorized to disable this user.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get("is_active") == False:
            subject, plain_message, html_content = self.deactivate_user(user)
        else:
            subject, plain_message, html_content = self.activate_user(user)

        send_email(
            subject=subject,
            plain_message=plain_message,
            html_content=html_content,
            to_email=[user.email],
        )

        return Response(
            {"message": "User status updated successfully"},
            status=status.HTTP_200_OK,
        )
