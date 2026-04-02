from django.urls import path

from .views import (
    EventListCreateView,
    EventDetailView,
    DuplicateEventView,
    VendorEventListView,
    VendorEventUpdateView,
    AdminEventListView,
    BookSeatView,
    MyBookingsView,
    CancelBookingView,
    VendorEventBookingsView,
)

app_name = "event"

urlpatterns = [
    path("events/admin-event/", AdminEventListView.as_view(), name="admin-event-list"),
    path(
        "events/vendor-event/", VendorEventListView.as_view(), name="vendor-event-list"
    ),
    path(
        "events/vendor-event/<str:pk>/",
        VendorEventUpdateView.as_view(),
        name="vendor-event-update",
    ),
    path("events/", EventListCreateView.as_view(), name="event-list-create"),
    path("events/<str:pk>/", EventDetailView.as_view(), name="event-detail"),
    path(
        "events-duplicate/<str:event_id>/",
        DuplicateEventView.as_view(),
        name="duplicate-event",
    ),
    # Booking endpoints
    path("bookings/", BookSeatView.as_view(), name="book-seat"),
    path("bookings/my/", MyBookingsView.as_view(), name="my-bookings"),
    path("bookings/vendor/", VendorEventBookingsView.as_view(), name="vendor-bookings"),
    path("bookings/<str:pk>/cancel/", CancelBookingView.as_view(), name="cancel-booking"),
]
