from rest_framework.permissions import BasePermission


class IsEventOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_vendor

    def has_object_permission(self, request, view, obj):
        return obj.vendor == request.user.vendor
