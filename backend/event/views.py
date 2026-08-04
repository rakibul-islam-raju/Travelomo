from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from user.permissions import IsCustomer, IsVendor, IsSystemAdmin

from .models import Event, SeatBooking
from .permissions import IsEventOwner
from .filters import EventFilter, VendorEventFilter, AdminEventFilter
from .serializers import (
    EventCreateSerializer,
    EventListSerializer,
    EventDetailSerializer,
    VendorEventListSerializer,
    SeatBookingCreateSerializer,
    SeatBookingListSerializer,
    VendorBookingListSerializer,
    PaymentReferenceSubmitSerializer,
    PaymentReviewSerializer,
)
from .services import (
    cancel_booking,
    reserve_booking,
    review_payment,
    submit_payment_reference,
)


class EventListCreateView(generics.ListCreateAPIView):
    """
    # Event list & create view
    * This api is for user, vendor and admin

    - Vendor can only see their own events
    - User can see all published and running events
    - Admin can see all events


    """

    filter_backends = [DjangoFilterBackend]
    filterset_class = EventFilter

    def get_queryset(self):
        # if user is vendor
        if self.request.user.role == "vendor":
            return Event.objects.filter(
                vendor=self.request.user.vendor,
                is_deleted=False,
            )
        # if user is admin
        elif self.request.user.role == "admin":
            return Event.objects.all()
        # if user is user
        else:
            return Event.objects.filter(
                is_deleted=False,
                is_archived=False,
                status="published",
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now(),
            )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return EventCreateSerializer
        return EventListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            self.permission_classes = [IsVendor]
        else:
            self.permission_classes = [AllowAny]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user.vendor)


class EventDetailView(generics.RetrieveAPIView):
    """
    # Event detail view
    * This api is only for user and vendor

    - Vendor can only see their own event details
    - User can see all published and running events details
    """

    serializer_class = EventDetailSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # If the user is an admin, return all events
        if getattr(self.request.user, "role", None) == "admin":
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
        print("FILTER PARAMS :=====>", self.request.query_params)

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


class BookSeatView(generics.GenericAPIView):
    serializer_class = SeatBookingCreateSerializer
    permission_classes = [IsCustomer]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = reserve_booking(
            user=request.user,
            event_id=serializer.validated_data["event"],
            seat_number=serializer.validated_data["seat_number"],
        )
        booking = (
            SeatBooking.objects.select_related("event__vendor")
            .prefetch_related("event__vendor__payment_methods")
            .get(pk=booking.pk)
        )
        return Response(
            SeatBookingListSerializer(booking, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class SubmitPaymentReferenceView(generics.GenericAPIView):
    serializer_class = PaymentReferenceSubmitSerializer
    permission_classes = [IsCustomer]

    def post(self, request, pk):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = submit_payment_reference(
            user=request.user,
            booking_id=pk,
            payment_method_id=serializer.validated_data["payment_method"],
            transaction_id=serializer.validated_data["transaction_id"],
        )
        booking = SeatBooking.objects.select_related(
            "event__vendor", "payment_submission__payment_method"
        ).get(pk=booking.pk)
        return Response(
            SeatBookingListSerializer(booking, context={"request": request}).data
        )


class MyBookingsView(generics.ListAPIView):
    serializer_class = SeatBookingListSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return (
            SeatBooking.objects.filter(user=self.request.user)
            .select_related(
                "event__vendor",
                "payment_submission__payment_method",
                "payment_submission__reviewed_by",
            )
            .prefetch_related("event__vendor__payment_methods")
            .order_by("-created_at")
        )


class CancelBookingView(generics.GenericAPIView):
    permission_classes = [IsCustomer]

    def post(self, request, pk):
        cancel_booking(user=request.user, booking_id=pk)
        return Response({"detail": "Booking cancelled successfully."})


class VendorEventBookingsView(generics.ListAPIView):
    serializer_class = VendorBookingListSerializer
    permission_classes = [IsVendor]

    def get_queryset(self):
        return (
            SeatBooking.objects.filter(event__vendor=self.request.user.vendor)
            .select_related(
                "event",
                "user",
                "payment_submission__payment_method",
                "payment_submission__reviewed_by",
            )
            .order_by("-created_at")
        )


class VendorReviewPaymentView(generics.GenericAPIView):
    serializer_class = PaymentReviewSerializer
    permission_classes = [IsVendor]

    def post(self, request, pk):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = review_payment(
            vendor=request.user.vendor,
            booking_id=pk,
            action=serializer.validated_data["action"],
            reason=serializer.validated_data.get("reason", ""),
        )
        booking = SeatBooking.objects.select_related(
            "event", "user", "payment_submission__payment_method"
        ).get(pk=booking.pk)
        return Response(
            VendorBookingListSerializer(booking, context={"request": request}).data
        )
