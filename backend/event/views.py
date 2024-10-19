from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from user.permissions import IsVendor

from .models import Event
from .permissions import IsEventOwner
from .filters import EventFilter, VendorEventFilter
from .serializers import (
    EventCreateSerializer,
    EventListSerializer,
    EventDetailSerializer,
    VendorEventListSerializer,
)


class EventListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend]
    filterset_class = EventFilter
    queryset = Event.objects.filter(
        is_deleted=False, is_archived=False, is_published=True
    )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return EventCreateSerializer
        return EventListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            self.permission_classes = [IsEventOwner]
        else:
            self.permission_classes = [AllowAny]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user.vendor)


class EventDetailView(generics.RetrieveAPIView):
    queryset = Event.objects.filter(
        is_deleted=False, is_archived=False, is_published=True
    )
    serializer_class = EventDetailSerializer
    permission_classes = [AllowAny]


#  View only for vendor owner
class DuplicateEventView(generics.GenericAPIView):
    queryset = Event.objects.filter(
        is_deleted=False, is_archived=False, is_published=True
    )
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
            "seat_available": event.seat_available,
            "actual_price": event.actual_price,
            "discount_price": event.discount_price,
            "features": event.features,
            "tags": event.tags,
            "is_published": False,
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


class VendorEventListView(generics.ListAPIView):
    serializer_class = VendorEventListSerializer
    permission_classes = [IsVendor]
    filter_backends = [DjangoFilterBackend]
    filterset_class = VendorEventFilter

    def get_queryset(self):
        return Event.objects.filter(
            vendor=self.request.user.vendor,
            is_deleted=False,
        )


class VendorEventUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = EventDetailSerializer
    permission_classes = [IsEventOwner]

    def get_queryset(self):
        return Event.objects.filter(
            vendor=self.request.user.vendor,
            is_deleted=False,
        )


class VendorEventDeleteView(generics.GenericAPIView):
    permission_classes = [IsEventOwner]

    def get_queryset(self):
        return Event.objects.filter(
            vendor=self.request.user.vendor,
            is_deleted=False,
        )

    def delete(self, request, *args, **kwargs):
        event = get_object_or_404(Event, id=kwargs["event_id"])
        event.is_deleted = True
        event.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UndoDeleteEventView(generics.GenericAPIView):
    permission_classes = [IsEventOwner]

    def get_queryset(self):
        return Event.objects.filter(
            vendor=self.request.user.vendor,
            is_deleted=True,
        )

    def post(self, request, *args, **kwargs):
        event = get_object_or_404(Event, id=kwargs["event_id"])
        event.is_deleted = False
        event.save()
        return Response(status=status.HTTP_200_OK)