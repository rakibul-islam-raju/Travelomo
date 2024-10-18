from rest_framework import generics
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .models import Event
from .filters import EventFilter
from .permissions import IsEventOwner
from .serializers import (
    EventCreateSerializer,
    EventListSerializer,
    EventDetailSerializer,
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
