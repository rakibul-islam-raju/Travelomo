"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bookingServices } from "@/services/bookingService";
import { useAuthStore } from "@/stores/authStore";
import { useMutation } from "@tanstack/react-query";
import { Armchair } from "lucide-react";
import { useRouter } from "next/navigation";
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
	const [open, setOpen] = useState(false);
	const [seatNumber, setSeatNumber] = useState(1);

	const totalPrice = (Number(price) * seatNumber).toFixed(2);

	const { mutate: bookSeat, isPending } = useMutation({
		mutationFn: () =>
			bookingServices.createBooking({ event: eventId, seat_number: seatNumber }),
		onSuccess: () => {
			toast.success("Booking confirmed! Check your email for details.");
			setOpen(false);
			router.refresh();
		},
	});

	const handleBookNowClick = () => {
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}
		setOpen(true);
	};

	const isSoldOut = availableSeats === 0;

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button
						className="w-full"
						size="lg"
						disabled={isSoldOut}
						onClick={handleBookNowClick}
					>
						<Armchair className="w-4 h-4 mr-2" />
						{isSoldOut ? "Sold Out" : "Book Now"}
					</Button>
				</DialogTrigger>

				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Confirm Your Booking</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label htmlFor="seat-number">Number of Seats</Label>
							<Input
								id="seat-number"
								type="number"
								min={1}
								max={availableSeats}
								value={seatNumber}
								onChange={(e) => {
									const val = Math.max(
										1,
										Math.min(availableSeats, Number(e.target.value))
									);
									setSeatNumber(val);
								}}
							/>
							<p className="text-xs text-muted-foreground">
								{availableSeats} seats available
							</p>
						</div>

						<div className="rounded-lg bg-muted px-4 py-3 space-y-1">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Price per seat</span>
								<span>${price}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Seats</span>
								<span>× {seatNumber}</span>
							</div>
							<div className="flex justify-between font-semibold border-t pt-1 mt-1">
								<span>Total</span>
								<span>${totalPrice}</span>
							</div>
						</div>

						{cancellationDays > 0 && (
							<p className="text-xs text-muted-foreground">
								Free cancellation up to {cancellationDays} day
								{cancellationDays !== 1 ? "s" : ""} before the event.
							</p>
						)}
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button onClick={() => bookSeat()} disabled={isPending}>
							{isPending ? "Booking..." : "Confirm Booking"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
