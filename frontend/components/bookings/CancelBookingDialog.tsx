"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useRefreshBookingData } from "@/hooks/useRefreshBookingData";
import { useSubmitOnce } from "@/hooks/useSubmitOnce";
import { getErrorMessage, isApiError } from "@/lib/apiError";
import { bookingServices } from "@/services/bookingService";
import { BookingStatus, IBooking } from "@/types/booking.types";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export type CancellableBooking = Pick<
	IBooking,
	"id" | "event" | "booking_reference" | "seat_number" | "status"
>;

const COPY: Partial<Record<BookingStatus, { title: string; body: string }>> = {
	awaiting_payment_reference: {
		title: "Cancel this reservation?",
		body: "Your held seats will be released. You haven't submitted a payment, so nothing else is needed.",
	},
	pending_verification: {
		title: "Cancel this booking?",
		body: "Your transaction ID will be withdrawn and the organizer won't review it. If you already paid, contact the organizer to arrange a refund.",
	},
	confirmed: {
		title: "Cancel this confirmed booking?",
		body: "Your seats will be released. Travelomo doesn't handle payments, so any refund is arranged directly with the organizer.",
	},
};

const DEFAULT_COPY = {
	title: "Cancel this booking?",
	body: "Your seats will be released.",
};

// The booking changed on the server, so retrying cannot succeed (API_CONTRACT.md §2.6).
const FINAL_ERROR_CODES = ["cancellation_closed", "invalid_booking_state", "not_found"];

const isFinalError = (error: unknown) =>
	isApiError(error) && FINAL_ERROR_CODES.includes(error.code ?? "");

interface CancelBookingConfirmationProps {
	booking: CancellableBooking;
	onKeep: () => void;
	onCancelled: () => void;
}

/** Confirmation step for cancelling a booking. Render inside a `DialogContent`. */
export function CancelBookingConfirmation({
	booking,
	onKeep,
	onCancelled,
}: CancelBookingConfirmationProps) {
	const refreshBookingData = useRefreshBookingData();
	const submitOnce = useSubmitOnce();
	const copy = COPY[booking.status] ?? DEFAULT_COPY;

	const { mutate, isPending, error } = useMutation({
		mutationFn: () => bookingServices.cancelBooking(booking.id),
		onSuccess: () => {
			toast.success("Booking cancelled and seats released");
			refreshBookingData(booking.event);
			onCancelled();
		},
		onError: (cancelError) => {
			if (isApiError(cancelError) && cancelError.code === "already_cancelled") {
				toast.info("This booking was already cancelled.");
				refreshBookingData(booking.event);
				onCancelled();
				return;
			}
			if (isFinalError(cancelError)) {
				refreshBookingData(booking.event);
			}
		},
	});

	const confirm = () =>
		submitOnce((release) => mutate(undefined, { onSettled: release }));

	return (
		<>
			<DialogHeader>
				<DialogTitle>{copy.title}</DialogTitle>
				<DialogDescription>{copy.body}</DialogDescription>
			</DialogHeader>

			<dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm">
				<div>
					<dt className="text-muted-foreground">Booking reference</dt>
					<dd className="font-semibold">{booking.booking_reference}</dd>
				</div>
				<div className="text-right">
					<dt className="text-muted-foreground">Seats</dt>
					<dd className="font-semibold">{booking.seat_number}</dd>
				</div>
			</dl>

			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{getErrorMessage(error)}</AlertDescription>
				</Alert>
			)}

			<DialogFooter className="gap-2">
				<Button variant="outline" onClick={onKeep} disabled={isPending}>
					Keep booking
				</Button>
				<Button
					variant="destructive"
					onClick={confirm}
					disabled={isPending || isFinalError(error)}
				>
					{isPending ? "Cancelling..." : "Yes, cancel"}
				</Button>
			</DialogFooter>
		</>
	);
}

interface CancelBookingDialogProps {
	/** The booking to cancel; `null` keeps the dialog closed. */
	booking: CancellableBooking | null;
	onClose: () => void;
}

export function CancelBookingDialog({ booking, onClose }: CancelBookingDialogProps) {
	return (
		<Dialog open={booking !== null} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				{booking && (
					<CancelBookingConfirmation
						key={booking.id}
						booking={booking}
						onKeep={onClose}
						onCancelled={onClose}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
