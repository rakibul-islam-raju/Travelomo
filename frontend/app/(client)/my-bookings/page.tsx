"use client";

import {
	CancelBookingDialog,
	CancellableBooking,
} from "@/components/bookings/CancelBookingDialog";
import { PaymentReferenceForm } from "@/components/bookings/PaymentReferenceForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRefreshBookingData } from "@/hooks/useRefreshBookingData";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/dates";
import { queryKeys } from "@/lib/queryKeys";
import { bookingServices } from "@/services/bookingService";
import { BookingStatus, IBooking } from "@/types/booking.types";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	Clock3,
	Lock,
	MapPin,
	ReceiptText,
	Ticket,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const BOOKINGS_PAGE_SIZE = 10;

const statusStyles: Record<BookingStatus, string> = {
	awaiting_payment_reference: "border-amber-200 bg-amber-50 text-amber-800",
	pending_verification: "border-blue-200 bg-blue-50 text-blue-800",
	confirmed: "border-green-200 bg-green-50 text-green-800",
	payment_rejected: "border-red-200 bg-red-50 text-red-800",
	expired: "border-gray-200 bg-gray-100 text-gray-700",
	cancelled: "border-gray-200 bg-gray-100 text-gray-700",
};

const statusGuidance: Record<BookingStatus, string> = {
	awaiting_payment_reference:
		"Your seats are held. Submit the external payment transaction ID before the timer ends.",
	pending_verification:
		"Your transaction ID is with the organizer. We'll update this booking after they review it.",
	confirmed: "The organizer verified your payment and your seats are confirmed.",
	payment_rejected:
		"The organizer could not verify this payment. Review the reason below before contacting them.",
	expired: "The reservation expired and its seats were released.",
	cancelled: "This booking was cancelled and its seats were released.",
};

function StatusIcon({ status }: { status: BookingStatus }) {
	if (status === "confirmed") return <CheckCircle2 className="h-4 w-4" />;
	if (status === "pending_verification") return <Clock3 className="h-4 w-4" />;
	if (status === "payment_rejected") return <XCircle className="h-4 w-4" />;
	if (status === "awaiting_payment_reference") return <ReceiptText className="h-4 w-4" />;
	return <AlertCircle className="h-4 w-4" />;
}

function formatMoney(amount: string, currency: string) {
	return new Intl.NumberFormat("en-BD", {
		style: "currency",
		currency,
	}).format(Number(amount));
}

function BookingCard({
	booking,
	onCancel,
}: {
	booking: IBooking;
	onCancel: (booking: CancellableBooking) => void;
}) {
	const refreshBookingData = useRefreshBookingData();
	const isAwaitingPayment = booking.status === "awaiting_payment_reference";
	const isNonCancellable = booking.status === "confirmed" && !booking.can_cancel;

	return (
		<article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
			<div className="p-5 sm:p-6">
				<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
					<div>
						<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							{booking.booking_reference}
						</p>
						<h2 className="mt-1 text-xl font-semibold">{booking.event_title}</h2>
					</div>
					<Badge variant="outline" className={`w-fit gap-1.5 px-3 py-1 ${statusStyles[booking.status]}`}>
						<StatusIcon status={booking.status} /> {booking.status_label}
					</Badge>
				</div>

				<div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
					<span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDate(booking.event_start_date)} – {formatDate(booking.event_end_date)}</span>
					<span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{booking.event_location}</span>
					<span className="flex items-center gap-1.5"><Ticket className="h-4 w-4" />{booking.seat_number} seat{booking.seat_number > 1 ? "s" : ""}</span>
				</div>

				<div className={`mt-4 rounded-xl border p-3 text-sm ${statusStyles[booking.status]}`}>
					{statusGuidance[booking.status]}
					{booking.payment_submission?.rejection_reason && (
						<p className="mt-2 font-medium">Reason: {booking.payment_submission.rejection_reason}</p>
					)}
				</div>

				<div className="mt-4 flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
					<div>
						<p className="text-xs text-muted-foreground">Booking total</p>
						<p className="text-lg font-bold">{formatMoney(booking.total_price, booking.currency)}</p>
					</div>
					{booking.can_cancel && !isAwaitingPayment && (
						<Button size="sm" variant="outline" onClick={() => onCancel(booking)}>
							Cancel booking
						</Button>
					)}
					{isNonCancellable && (
						<p className="flex items-center gap-1.5 text-sm text-muted-foreground">
							<Lock className="h-4 w-4" />
							Cancellation is closed for this booking. Contact the organizer if your plans change.
						</p>
					)}
				</div>
			</div>

			{isAwaitingPayment && (
				<div className="border-t bg-muted/20 p-5 sm:p-6">
					<PaymentReferenceForm
						booking={booking}
						compact
						onSubmitted={() => refreshBookingData(booking.event)}
						onCancel={() => onCancel(booking)}
						onExpired={() => refreshBookingData(booking.event)}
					/>
				</div>
			)}
		</article>
	);
}

export default function MyBookingsPage() {
	const [bookingToCancel, setBookingToCancel] = useState<CancellableBooking | null>(null);

	const {
		data,
		error,
		isLoading,
		isError,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isFetchNextPageError,
	} = useInfiniteQuery({
		queryKey: queryKeys.myBookings,
		queryFn: ({ pageParam }) =>
			bookingServices.getMyBookings({ limit: BOOKINGS_PAGE_SIZE, offset: pageParam }),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) =>
			lastPage.next ? allPages.length * BOOKINGS_PAGE_SIZE : undefined,
		refetchInterval: 60_000,
	});

	if (isLoading) {
		return (
			<div className="mx-auto max-w-4xl space-y-4 py-8" aria-busy="true" aria-label="Loading bookings">
				<div className="h-10 w-56 animate-pulse rounded-lg bg-muted" />
				{[...Array(3)].map((_, index) => (
					<div key={index} className="h-44 animate-pulse rounded-2xl border bg-muted/50" />
				))}
			</div>
		);
	}

	if (isError && !data) {
		return (
			<div className="mx-auto max-w-xl py-20 text-center">
				<AlertCircle className="mx-auto h-10 w-10 text-destructive" />
				<h1 className="mt-4 text-xl font-bold">We couldn&apos;t load your bookings</h1>
				<p className="mt-2 text-muted-foreground">{getErrorMessage(error)}</p>
				<Button className="mt-5" onClick={() => refetch()}>Try again</Button>
			</div>
		);
	}

	// Offset pages can overlap if a booking is added while paging; show each once.
	const bookings = [
		...new Map(
			(data?.pages ?? []).flatMap((page) => page.results).map((booking) => [booking.id, booking])
		).values(),
	];
	const totalCount = data?.pages[0]?.count ?? 0;

	return (
		<div className="mx-auto max-w-4xl space-y-6 py-8">
			<div>
				<p className="text-sm font-medium text-primary">Your trips</p>
				<h1 className="text-3xl font-bold tracking-tight">My bookings</h1>
				<p className="mt-1 text-muted-foreground">
					Finish pending payments and follow verification progress here.
				</p>
			</div>

			{bookings.length === 0 ? (
				<div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
					<Ticket className="mx-auto mb-3 h-10 w-10 opacity-40" />
					<h2 className="font-semibold text-foreground">No bookings yet</h2>
					<p className="mt-1 text-sm">Find an event you love and reserve your seats.</p>
					<Button asChild className="mt-5"><Link href="/events">Explore events</Link></Button>
				</div>
			) : (
				<div className="space-y-5">
					{bookings.map((booking) => (
						<BookingCard key={booking.id} booking={booking} onCancel={setBookingToCancel} />
					))}

					<div className="flex flex-col items-center gap-2 pt-2 text-sm text-muted-foreground">
						<p>
							Showing {bookings.length} of {totalCount} booking{totalCount === 1 ? "" : "s"}
						</p>
						{isFetchNextPageError && (
							<p className="text-destructive" role="alert">
								{getErrorMessage(error)}
							</p>
						)}
						{hasNextPage && (
							<Button
								variant="outline"
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
							>
								{isFetchingNextPage ? "Loading..." : "Load more bookings"}
							</Button>
						)}
					</div>
				</div>
			)}

			<CancelBookingDialog booking={bookingToCancel} onClose={() => setBookingToCancel(null)} />
		</div>
	);
}
