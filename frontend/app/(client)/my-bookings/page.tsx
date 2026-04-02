"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bookingServices } from "@/services/bookingService";
import { IBooking } from "@/types/booking.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/dates";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { toast } from "sonner";

export default function MyBookingsPage() {
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ["MyBookings"],
		queryFn: () => bookingServices.getMyBookings(),
	});

	const { mutate: cancelBooking, isPending: cancelling } = useMutation({
		mutationFn: (id: string) => bookingServices.cancelBooking(id),
		onSuccess: () => {
			toast.success("Booking cancelled successfully.");
			queryClient.invalidateQueries({ queryKey: ["MyBookings"] });
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-4">
				{[...Array(3)].map((_, i) => (
					<div
						key={i}
						className="h-32 rounded-xl border bg-muted animate-pulse"
					/>
				))}
			</div>
		);
	}

	const bookings = data?.results ?? [];

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			<h1 className="text-2xl font-bold">My Bookings</h1>

			{bookings.length === 0 ? (
				<div className="text-center py-16 text-muted-foreground">
					<Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
					<p>You have no bookings yet.</p>
				</div>
			) : (
				<div className="space-y-4">
					{bookings.map((booking: IBooking) => (
						<div
							key={booking.id}
							className="rounded-xl border bg-card p-5 shadow-sm space-y-3"
						>
							<div className="flex items-start justify-between gap-3">
								<h2 className="font-semibold text-lg leading-tight">
									{booking.event_title}
								</h2>
								<Badge
									variant={
										booking.status === "confirmed" ? "default" : "secondary"
									}
								>
									{booking.status}
								</Badge>
							</div>

							<div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
								<span className="flex items-center gap-1.5">
									<Calendar className="w-4 h-4" />
									{formatDate(booking.event_start_date)} –{" "}
									{formatDate(booking.event_end_date)}
								</span>
								<span className="flex items-center gap-1.5">
									<MapPin className="w-4 h-4" />
									{booking.event_location}
								</span>
							</div>

							<div className="flex items-center justify-between pt-1">
								<div className="text-sm space-x-4">
									<span>
										<span className="text-muted-foreground">Seats: </span>
										<span className="font-medium">{booking.seat_number}</span>
									</span>
									<span>
										<span className="text-muted-foreground">Total: </span>
										<span className="font-medium">${booking.total_price}</span>
									</span>
								</div>

								{booking.can_cancel && (
									<Button
										variant="destructive"
										size="sm"
										disabled={cancelling}
										onClick={() => cancelBooking(booking.id)}
									>
										Cancel
									</Button>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
