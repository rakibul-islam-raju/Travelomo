import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * After a booking changes, refetch the customer's bookings, the affected
 * event's live seat count, and the server-rendered event page.
 */
export function useRefreshBookingData() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useCallback(
		(eventId?: string) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.myBookings });
			queryClient.invalidateQueries({
				queryKey: eventId
					? queryKeys.eventAvailability(eventId)
					: queryKeys.allEventAvailability,
			});
			router.refresh();
		},
		[queryClient, router]
	);
}
