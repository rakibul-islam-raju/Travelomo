from django.urls import path

from .views import UserListView, UserDetailView, StaffListView, StaffDetailView

app_name = "user"

urlpatterns = [
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<str:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("staffs/", StaffListView.as_view(), name="staff-list"),
    path(
        "staffs/<str:pk>/",
        StaffDetailView.as_view(),
        name="staff-detail",
    ),
]
