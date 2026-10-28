import { fetcher } from "@/lib/fetcher";
import { GenericListParams, GenericListResponse } from "@/types/common";
import {
	IBooking,
	IBookingCreate,
	IVendorBooking,
} from "@/types/booking.types";

const toQueryParams = (params: GenericListParams = {}) =>
	Object.fromEntries(
		Object.entries(params)
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => [key, String(value)])
	);

// Customer booking calls are `silent`: the booking dialog, payment form,
// cancellation dialog and My Bookings page show their errors inline.
export const bookingServices = {
	createBooking: async (data: IBookingCreate) => {
		return await fetcher<IBooking>("/bookings/", {
			method: "POST",
			body: data,
			silent: true,
		});
	},

	getMyBookings: async (params?: GenericListParams) => {
		return await fetcher<GenericListResponse<IBooking>>("/bookings/my/", {
			params: toQueryParams(params),
			silent: true,
		});
	},

	submitPaymentReference: async (
		bookingId: string,
		data: { payment_method: string; transaction_id: string }
	) => {
		return await fetcher<IBooking>(
			`/bookings/${bookingId}/payment-reference/`,
			{ method: "POST", body: data, silent: true }
		);
	},

	cancelBooking: async (bookingId: string) => {
		return await fetcher<{ detail: string }>(`/bookings/${bookingId}/cancel/`, {
			method: "POST",
			silent: true,
		});
	},

	getVendorBookings: async (params?: GenericListParams) => {
		return await fetcher<GenericListResponse<IVendorBooking>>(
			"/bookings/vendor/",
			{ params: toQueryParams(params) }
		);
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
