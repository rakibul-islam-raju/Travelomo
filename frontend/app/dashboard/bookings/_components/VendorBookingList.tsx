"use client";

import { Badge } from "@/components/ui/badge";
import { bookingServices } from "@/services/bookingService";
import { IVendorBooking } from "@/types/booking.types";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/dates";
import { Ticket } from "lucide-react";
import { NoDataFound } from "../../_components/NoDataFound";

export default function VendorBookingList() {
	const { data, isLoading } = useQuery({
		queryKey: ["VendorBookings"],
		queryFn: () => bookingServices.getVendorBookings(),
		staleTime: 5 * 60 * 1000,
	});

	if (isLoading) {
		return (
			<div className="space-y-3">
				{[...Array(5)].map((_, i) => (
					<div
						key={i}
						className="h-14 rounded-lg border bg-muted animate-pulse"
					/>
				))}
			</div>
		);
	}

	const bookings = data?.results ?? [];

	if (bookings.length === 0) {
		return <NoDataFound />;
	}

	return (
		<div className="rounded-xl border overflow-hidden">
			<table className="w-full text-sm">
				<thead className="bg-muted text-muted-foreground">
					<tr>
						<th className="px-4 py-3 text-left font-medium">Event</th>
						<th className="px-4 py-3 text-left font-medium">Customer</th>
						<th className="px-4 py-3 text-left font-medium">Email</th>
						<th className="px-4 py-3 text-center font-medium">Seats</th>
						<th className="px-4 py-3 text-right font-medium">Total</th>
						<th className="px-4 py-3 text-center font-medium">Status</th>
						<th className="px-4 py-3 text-right font-medium">Date</th>
					</tr>
				</thead>
				<tbody className="divide-y">
					{bookings.map((booking: IVendorBooking) => (
						<tr key={booking.id} className="hover:bg-muted/40 transition-colors">
							<td className="px-4 py-3 font-medium max-w-[180px] truncate">
								{booking.event_title}
							</td>
							<td className="px-4 py-3 text-muted-foreground">
								{booking.user_name}
							</td>
							<td className="px-4 py-3 text-muted-foreground">
								{booking.user_email}
							</td>
							<td className="px-4 py-3 text-center">
								<span className="inline-flex items-center gap-1">
									<Ticket className="w-3.5 h-3.5 text-muted-foreground" />
									{booking.seat_number}
								</span>
							</td>
							<td className="px-4 py-3 text-right font-medium">
								${booking.total_price}
							</td>
							<td className="px-4 py-3 text-center">
								<Badge
									variant={
										booking.status === "confirmed" ? "default" : "secondary"
									}
								>
									{booking.status}
								</Badge>
							</td>
							<td className="px-4 py-3 text-right text-muted-foreground">
								{formatDate(booking.created_at)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
