from django.urls import path

from .views import (
    EventListCreateView,
    EventDetailView,
    DuplicateEventView,
    VendorEventListView,
    VendorEventUpdateView,
    VendorEventDeleteView,
    UndoDeleteEventView,
    AdminEventListView,
)

app_name = "event"

urlpatterns = [
    path(
        "events/admin-event/", AdminEventListView.as_view(), name="admin-event-list"
    ),
    path(
        "events/vendor-event/", VendorEventListView.as_view(), name="vendor-event-list"
    ),
    path(
        "events/vendor-event/<str:pk>/",
        VendorEventUpdateView.as_view(),
        name="vendor-event-update",
    ),
    path(
        "events/vendor-event/delete/<str:event_id>/",
        VendorEventDeleteView.as_view(),
        name="vendor-event-delete",
    ),
    path(
        "events/vendor-event-undo-delete/<str:event_id>/",
        UndoDeleteEventView.as_view(),
        name="undo-delete-event",
    ),
    path("events/", EventListCreateView.as_view(), name="event-list-create"),
    path("events/<str:pk>/", EventDetailView.as_view(), name="event-detail"),
    path(
        "events-duplicate/<str:event_id>/",
        DuplicateEventView.as_view(),
        name="duplicate-event",
    ),
]
