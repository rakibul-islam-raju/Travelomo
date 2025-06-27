from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from user.permissions import IsVendor, IsSystemAdmin

from .models import Event
from .permissions import IsEventOwner
from .filters import EventFilter, VendorEventFilter, AdminEventFilter
from .serializers import (
    EventCreateSerializer,
    EventListSerializer,
    EventDetailSerializer,
    VendorEventListSerializer,
)


class EventListCreateView(generics.ListAPIView):
    filter_backends = [DjangoFilterBackend]
    filterset_class = EventFilter
    queryset = Event.objects.filter(is_archived=False, status="published")
    serializer_class = EventListSerializer
    permission_classes = [AllowAny]


class EventDetailView(generics.RetrieveAPIView):
    serializer_class = EventDetailSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # If the user is an admin, return all events
        if self.request.user.role == "admin":
            return Event.objects.all()

        return Event.objects.filter(is_archived=False, status="published")


#  View only for vendor owner
class DuplicateEventView(generics.GenericAPIView):
    queryset = Event.objects.filter(is_archived=False, status="published")
    serializer_class = EventDetailSerializer
    permission_classes = [IsEventOwner]

    def post(self, request, *args, **kwargs):
        event = get_object_or_404(Event, id=kwargs["event_id"])
        # Create a new event object by copying the existing event
        event_data = {
            "title": f"Copy of {event.title}",
            "description": event.description,
            "start_date": event.start_date,
            "end_date": event.end_date,
            "location": event.location,
            "available_seats": event.available_seats,
            "actual_price": event.actual_price,
            "discount_price": event.discount_price,
            "tags": event.tags,
            "status": "draft",
        }

        # Check if the original event has an image
        if event.image:
            event_data["image"] = event.image

        serializer = EventCreateSerializer(data=event_data)
        serializer.is_valid(raise_exception=True)
        serializer.save(vendor=event.vendor)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class VendorEventListView(generics.ListCreateAPIView):
    permission_classes = [IsVendor]
    filter_backends = [DjangoFilterBackend]
    filterset_class = VendorEventFilter

    def get_queryset(self):
        return Event.objects.filter(
            vendor=self.request.user.vendor,
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return EventCreateSerializer
        return VendorEventListSerializer

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user.vendor)


class VendorEventUpdateView(generics.RetrieveDestroyAPIView):
    serializer_class = EventDetailSerializer
    permission_classes = [IsEventOwner]

    def get_queryset(self):
        return Event.objects.filter(
            vendor=self.request.user.vendor,
        )


# view for admin
class AdminEventListView(generics.ListAPIView):
    queryset = Event.objects.all()
    serializer_class = EventListSerializer
    permission_classes = [IsSystemAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_class = AdminEventFilter
    ordering = ["-created_at"]
