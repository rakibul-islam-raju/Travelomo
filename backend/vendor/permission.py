from rest_framework.permissions import BasePermission


class IsVendorOwnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == "admin" or request.user.role == "vendor"
        )

    def has_object_permission(self, request, view, obj):
        return request.user.role == "admin" or request.user.vendor.id == obj.id
