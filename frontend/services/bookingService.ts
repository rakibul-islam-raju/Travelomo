import { fetcher } from "@/lib/fetcher";
import { GenericListResponse } from "@/types/common";
import {
	IBooking,
	IBookingCreate,
	IVendorBooking,
} from "@/types/booking.types";

export const bookingServices = {
	createBooking: async (data: IBookingCreate) => {
		return await fetcher<IBooking>("/bookings/", {
			method: "POST",
			body: data,
		});
	},

	getMyBookings: async () => {
		return await fetcher<GenericListResponse<IBooking>>("/bookings/my/");
	},

	submitPaymentReference: async (
		bookingId: string,
		data: { payment_method: string; transaction_id: string }
	) => {
		return await fetcher<IBooking>(
			`/bookings/${bookingId}/payment-reference/`,
			{ method: "POST", body: data }
		);
	},

	cancelBooking: async (bookingId: string) => {
		return await fetcher<{ detail: string }>(`/bookings/${bookingId}/cancel/`, {
			method: "POST",
		});
	},

	getVendorBookings: async () => {
		return await fetcher<GenericListResponse<IVendorBooking>>("/bookings/vendor/");
	},

	reviewPayment: async (
		bookingId: string,
		data: { action: "approve" | "reject"; reason?: string }
	) => {
		return await fetcher<IVendorBooking>(
			`/bookings/vendor/${bookingId}/review/`,
			{ method: "POST", body: data }
		);
	},
};
