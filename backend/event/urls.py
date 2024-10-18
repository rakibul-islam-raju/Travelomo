from django.urls import path

from .views import EventListCreateView, EventDetailView

app_name = "event"

urlpatterns = [
    path("events/", EventListCreateView.as_view(), name="event-list-create"),
    path("events/<str:pk>/", EventDetailView.as_view(), name="event-detail"),
]
