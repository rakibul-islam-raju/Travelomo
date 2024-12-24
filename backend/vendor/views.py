from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters

from user.permissions import IsSystemAdmin, IsVendor

from .models import Vendor
from .serializers import (
    VendorListSerializer,
    VendorDetailSerializer,
    VendorApprovalSerializer,
    VendorCreateSerializer,
)


class VendorListCreateView(generics.ListCreateAPIView):
    queryset = Vendor.objects.all()
    filterset_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["store_name", "store_description"]
    filterset_fields = ["is_approved"]
    permission_classes = [IsSystemAdmin]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return VendorCreateSerializer
        return VendorListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            self.permission_classes = [IsVendor]
        else:
            self.permission_classes = [IsSystemAdmin]
        return super().get_permissions()


class VendorApprovalView(generics.UpdateAPIView):
    permission_classes = [IsSystemAdmin]
    queryset = Vendor.objects.all()
    serializer_class = VendorApprovalSerializer

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return VendorApprovalSerializer
        return VendorDetailSerializer


class VendorDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorDetailSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            self.permission_classes = [IsVendor | IsSystemAdmin]
        elif self.request.method == "DELETE":
            self.permission_classes = [IsSystemAdmin]
        else:
            self.permission_classes = [IsVendor]
        return super().get_permissions()
