"use client";

import { PaymentReferenceForm } from "@/components/bookings/PaymentReferenceForm";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bookingServices } from "@/services/bookingService";
import { useAuthStore } from "@/stores/authStore";
import { IBooking } from "@/types/booking.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Armchair, CheckCircle2, ShieldCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface BookingSidebarProps {
	eventId: string;
	availableSeats: number;
	price: string;
	cancellationDays: number;
}

export default function BookingSidebar({
	eventId,
	availableSeats,
	price,
	cancellationDays,
}: BookingSidebarProps) {
	const { isAuthenticated } = useAuthStore();
	const router = useRouter();
	const pathname = usePathname();
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [seatNumber, setSeatNumber] = useState(1);
	const [booking, setBooking] = useState<IBooking | null>(null);
	const [submitted, setSubmitted] = useState(false);

	const totalPrice = (Number(price) * seatNumber).toFixed(2);

	const { mutate: reserveSeats, isPending: reserving } = useMutation({
		mutationFn: () =>
			bookingServices.createBooking({ event: eventId, seat_number: seatNumber }),
		onSuccess: (createdBooking) => {
			setBooking(createdBooking);
			toast.success("Your seats are held for 20 minutes", {
				description: "Complete the external payment and submit its transaction ID.",
			});
			queryClient.invalidateQueries({ queryKey: ["MyBookings"] });
			router.refresh();
		},
	});

	const { mutate: cancelReservation, isPending: cancelling } = useMutation({
		mutationFn: () => bookingServices.cancelBooking(booking!.id),
		onSuccess: () => {
			toast.success("Reservation cancelled and seats released");
			setBooking(null);
			setOpen(false);
			queryClient.invalidateQueries({ queryKey: ["MyBookings"] });
			router.refresh();
		},
	});

	const handleBookNowClick = () => {
		if (!isAuthenticated) {
			router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
			return;
		}
		setOpen(true);
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && booking?.status === "awaiting_payment_reference") {
			toast.info("Your reservation is saved in My Bookings", {
				description: "You can submit the transaction ID there before the timer ends.",
			});
		}
		setOpen(nextOpen);
	};

	const isSoldOut = availableSeats === 0;

	return (
		<>
				<Button
					className="w-full"
					size="lg"
					disabled={isSoldOut}
					onClick={handleBookNowClick}
				>
					<Armchair className="mr-2 h-4 w-4" />
					{isSoldOut ? "Sold Out" : "Reserve & Book"}
				</Button>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
				{!booking && (
					<>
						<DialogHeader>
							<DialogTitle>Reserve your seats</DialogTitle>
							<p className="text-sm text-muted-foreground">
								We&apos;ll hold them while you pay the organizer outside Travelomo.
							</p>
						</DialogHeader>

						<div className="space-y-5 py-3">
							<div className="space-y-2">
								<Label htmlFor="seat-number">How many seats?</Label>
								<Input
									id="seat-number"
									type="number"
									min={1}
									max={availableSeats}
									value={seatNumber}
									onChange={(event) => {
										const parsed = Number(event.target.value) || 1;
										setSeatNumber(Math.max(1, Math.min(availableSeats, parsed)));
									}}
								/>
								<p className="text-xs text-muted-foreground">
									{availableSeats} seats currently available
								</p>
							</div>

							<div className="rounded-xl bg-muted/70 p-4">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">BDT {price} × {seatNumber}</span>
									<span className="font-medium">{seatNumber} seat{seatNumber > 1 ? "s" : ""}</span>
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
									Confirmed bookings can be cancelled up to {cancellationDays} day{cancellationDays !== 1 ? "s" : ""} before the event. Refunds are arranged directly with the organizer.
								</p>
							)}
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setOpen(false)}>
								Not now
							</Button>
							<Button onClick={() => reserveSeats()} disabled={reserving}>
								{reserving ? "Holding seats..." : "Hold seats & continue"}
							</Button>
						</DialogFooter>
					</>
				)}

				{booking && !submitted && (
					<>
						<DialogHeader>
							<DialogTitle>Complete your booking</DialogTitle>
						</DialogHeader>
						<PaymentReferenceForm
							booking={booking}
							onSubmitted={(updatedBooking) => {
								setBooking(updatedBooking);
								setSubmitted(true);
								queryClient.invalidateQueries({ queryKey: ["MyBookings"] });
							}}
							onCancel={() => cancelReservation()}
						/>
						{cancelling && (
							<p className="text-center text-sm text-muted-foreground">
								Releasing your seats...
							</p>
						)}
					</>
				)}

				{booking && submitted && (
					<div className="py-8 text-center">
						<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
							<CheckCircle2 className="h-8 w-8" />
						</div>
						<h2 className="mt-4 text-xl font-bold">Sent for verification</h2>
						<p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
							The organizer will check transaction {booking.payment_submission?.transaction_id} and confirm your seats. No further action is needed right now.
						</p>
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
