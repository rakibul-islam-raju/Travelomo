"use client";

import { CancelBookingConfirmation } from "@/components/bookings/CancelBookingDialog";
import { PaymentReferenceForm } from "@/components/bookings/PaymentReferenceForm";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRefreshBookingData } from "@/hooks/useRefreshBookingData";
import { useSubmitOnce } from "@/hooks/useSubmitOnce";
import { getErrorMessage, isApiError } from "@/lib/apiError";
import { queryKeys } from "@/lib/queryKeys";
import { buildLoginUrl } from "@/lib/redirect";
import { bookingServices } from "@/services/bookingService";
import { eventServices } from "@/services/eventService";
import { useAuthStore } from "@/stores/authStore";
import { IBooking } from "@/types/booking.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, Armchair, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// Matches SeatBookingCreateSerializer.seat_number max_value in the API.
export const MAX_SEATS_PER_BOOKING = 100;

// Reservation errors meaning the event changed since the page loaded (API_CONTRACT.md §2.6).
const STALE_EVENT_CODES = [
	"sold_out",
	"booking_closed",
	"event_not_bookable",
	"payment_unavailable",
];

type View = "select" | "pay" | "confirm-cancel" | "submitted";

interface BookingSidebarProps {
	eventId: string;
	availableSeats: number;
	price: string;
	cancellationDays: number;
	/** Set when the event cannot be booked (not published, already started). */
	unavailableReason?: string | null;
}

export function getSeatError(input: string, availableSeats: number): string | null {
	if (input.trim() === "") return "Enter how many seats you need.";
	const seats = Number(input);
	if (!Number.isInteger(seats) || seats < 1) return "Choose at least 1 whole seat.";
	if (seats > MAX_SEATS_PER_BOOKING) {
		return `You can book up to ${MAX_SEATS_PER_BOOKING} seats at a time.`;
	}
	if (seats > availableSeats) {
		return availableSeats === 1
			? "Only 1 seat is left."
			: `Only ${availableSeats} seats are left.`;
	}
	return null;
}

export default function BookingSidebar({
	eventId,
	availableSeats: initialAvailableSeats,
	price,
	cancellationDays,
	unavailableReason,
}: BookingSidebarProps) {
	const { isAuthenticated, user } = useAuthStore();
	const router = useRouter();
	const pathname = usePathname();
	const refreshBookingData = useRefreshBookingData();
	const submitOnce = useSubmitOnce();

	const [open, setOpen] = useState(false);
	const [view, setView] = useState<View>("select");
	const [seatInput, setSeatInput] = useState("1");
	const [booking, setBooking] = useState<IBooking | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	// Live seat count: refetched when the dialog opens and after every booking change.
	const { data: availableSeats = initialAvailableSeats, refetch: refetchAvailability } =
		useQuery({
			queryKey: queryKeys.eventAvailability(eventId),
			queryFn: async () =>
				(await eventServices.getPublicEvent(eventId)).available_seats ?? 0,
			initialData: initialAvailableSeats,
			staleTime: 30_000,
		});

	const reserve = useMutation({
		mutationFn: () =>
			bookingServices.createBooking({
				event: eventId,
				seat_number: Number(seatInput),
			}),
		onSuccess: (createdBooking) => {
			setBooking(createdBooking);
			setNotice(null);
			setView("pay");
			toast.success("Your seats are held", {
				description: "Complete the external payment and submit its transaction ID.",
			});
			refreshBookingData(eventId);
		},
		onError: (error) => {
			if (
				isApiError(error) &&
				(STALE_EVENT_CODES.includes(error.code ?? "") ||
					error.fieldErrors.seat_number)
			) {
				refreshBookingData(eventId);
			}
		},
	});

	const reserveError = isApiError(reserve.error) ? reserve.error : null;
	const localSeatError = availableSeats > 0 ? getSeatError(seatInput, availableSeats) : null;
	const serverSeatError = reserveError?.fieldErrors.seat_number?.[0];
	const seatError = localSeatError ?? serverSeatError;
	const generalReserveError =
		reserve.error && !serverSeatError ? getErrorMessage(reserve.error) : null;
	const isSoldOut = availableSeats <= 0;
	const isCustomer = user?.role === "customer";
	const seatCount = Number(seatInput) || 0;
	const totalPrice = (Number(price) * seatCount).toFixed(2);

	const resetToStart = () => {
		setBooking(null);
		setView("select");
		setSeatInput("1");
		reserve.reset();
	};

	const handleBookNowClick = () => {
		if (!isAuthenticated) {
			router.push(buildLoginUrl(`${pathname}${window.location.search}`));
			return;
		}
		if (view === "submitted") resetToStart();
		if (view === "confirm-cancel") setView("pay");
		refetchAvailability();
		setOpen(true);
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && booking && (view === "pay" || view === "confirm-cancel")) {
			toast.info("Your reservation is saved in My Bookings", {
				description: "You can submit the transaction ID there before the timer ends.",
			});
		}
		setOpen(nextOpen);
	};

	const handleReserve = () =>
		submitOnce((release) => reserve.mutate(undefined, { onSettled: release }));

	// Only the trigger is disabled: an open dialog stays mounted even when this
	// customer's own reservation takes the last seats.
	const blockedMessage =
		unavailableReason ??
		(isSoldOut
			? "All seats are booked right now. Seats can open up again if a reservation expires or is cancelled."
			: isAuthenticated && !isCustomer
				? "Booking is available to customer accounts only."
				: null);
	const blockedLabel = unavailableReason
		? "Not available"
		: isSoldOut
			? "Sold out"
			: "Customers only";

	return (
		<>
			{blockedMessage ? (
				<div className="space-y-2">
					<Button className="w-full" size="lg" disabled>
						<Armchair className="mr-2 h-4 w-4" />
						{blockedLabel}
					</Button>
					<p className="text-center text-sm text-muted-foreground">{blockedMessage}</p>
				</div>
			) : (
				<Button className="w-full" size="lg" onClick={handleBookNowClick}>
					<Armchair className="mr-2 h-4 w-4" />
					Reserve &amp; Book
				</Button>
			)}
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
					{view === "select" && (
						<>
							<DialogHeader>
								<DialogTitle>Reserve your seats</DialogTitle>
								<DialogDescription>
									We&apos;ll hold them while you pay the organizer outside Travelomo.
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-5 py-3">
								{notice && (
									<Alert>
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>{notice}</AlertDescription>
									</Alert>
								)}

								<div className="space-y-2">
									<Label htmlFor="seat-number">How many seats?</Label>
									<Input
										id="seat-number"
										type="number"
										inputMode="numeric"
										min={1}
										max={Math.min(availableSeats, MAX_SEATS_PER_BOOKING)}
										value={seatInput}
										disabled={reserve.isPending}
										aria-invalid={Boolean(seatError)}
										aria-describedby="seat-number-help"
										onChange={(event) => {
											setSeatInput(event.target.value);
											reserve.reset();
										}}
									/>
									<p
										id="seat-number-help"
										className={`text-sm ${seatError ? "text-destructive" : "text-muted-foreground"}`}
									>
										{seatError ??
											`${availableSeats} seat${availableSeats === 1 ? "" : "s"} currently available`}
									</p>
								</div>

								<div className="rounded-xl bg-muted/70 p-4">
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">
											BDT {price} × {seatCount}
										</span>
										<span className="font-medium">
											{seatCount} seat{seatCount === 1 ? "" : "s"}
										</span>
									</div>
									<div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold">
										<span>Total due</span>
										<span>BDT {totalPrice}</span>
									</div>
								</div>

								<div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
									<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
									<div>
										<p className="font-semibold">No payment happens inside Travelomo</p>
										<p className="mt-1 text-blue-900/80">
											After reserving, follow the organizer&apos;s payment instructions and enter the transaction ID.
										</p>
									</div>
								</div>

								{cancellationDays > 0 && (
									<p className="text-xs text-muted-foreground">
										Confirmed bookings can be cancelled up to {cancellationDays} day
										{cancellationDays !== 1 ? "s" : ""} before the event. Refunds are arranged directly with the organizer.
									</p>
								)}

								{(generalReserveError || isSoldOut) && (
									<Alert variant="destructive">
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>
											{generalReserveError ?? "This event just sold out."}
											{reserveError?.code === "unfinished_booking_exists" && (
												<Link href="/my-bookings" className="mt-1 block font-medium underline">
													Go to My Bookings
												</Link>
											)}
										</AlertDescription>
									</Alert>
								)}
							</div>

							<DialogFooter>
								<Button variant="outline" onClick={() => setOpen(false)}>
									Not now
								</Button>
								<Button
									onClick={handleReserve}
									disabled={reserve.isPending || isSoldOut || Boolean(localSeatError)}
								>
									{reserve.isPending ? "Holding seats..." : "Hold seats & continue"}
								</Button>
							</DialogFooter>
						</>
					)}

					{view === "pay" && booking && (
						<>
							<DialogHeader>
								<DialogTitle>Complete your booking</DialogTitle>
								<DialogDescription>
									Pay the organizer, then enter the transaction ID from your receipt.
								</DialogDescription>
							</DialogHeader>
							<PaymentReferenceForm
								booking={booking}
								onSubmitted={(updatedBooking) => {
									setBooking(updatedBooking);
									setView("submitted");
									refreshBookingData(eventId);
								}}
								onCancel={() => setView("confirm-cancel")}
								onExpired={() => {
									resetToStart();
									setNotice("Your previous seat hold expired. Choose your seats to start again.");
									refreshBookingData(eventId);
								}}
							/>
						</>
					)}

					{view === "confirm-cancel" && booking && (
						<CancelBookingConfirmation
							booking={booking}
							onKeep={() => setView("pay")}
							onCancelled={() => {
								resetToStart();
								setOpen(false);
							}}
						/>
					)}

					{view === "submitted" && booking && (
						<div className="py-8 text-center">
							<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
								<CheckCircle2 className="h-8 w-8" />
							</div>
							<DialogTitle className="mt-4 text-xl font-bold">
								Sent for verification
							</DialogTitle>
							<DialogDescription className="mx-auto mt-2 max-w-md">
								The organizer will check transaction {booking.payment_submission?.transaction_id} and confirm your seats. No further action is needed right now.
							</DialogDescription>
							<div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
								<Button variant="outline" onClick={() => setOpen(false)}>
									Close
								</Button>
								<Button onClick={() => router.push("/my-bookings")}>
									View my bookings
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
