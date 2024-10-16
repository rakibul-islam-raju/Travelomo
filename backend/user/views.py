from rest_framework import viewsets
from rest_framework import generics, filters
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend

from .models import User
from .serializers import (
    UserListSerializer,
    UserDetailSerializer,
    StaffListSerializer,
    StaffDetailSerializer,
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


class StaffListView(generics.ListAPIView):
    queryset = User.objects.filter(is_staff=True, role="admin")
    serializer_class = StaffListSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["email", "first_name", "last_name", "profile__phone_number"]
    filterset_fields = ["is_active", "is_staff", "is_superuser"]


class StaffDetailView(generics.RetrieveAPIView):
    queryset = User.objects.filter(is_staff=True, role="admin")
    serializer_class = StaffDetailSerializer
