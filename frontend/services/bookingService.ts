import { fetcher } from "@/lib/fetcher";
import { GenericListResponse } from "@/types/common";
import { IBooking, IBookingCreate, IVendorBooking } from "@/types/booking.types";

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

	cancelBooking: async (bookingId: string) => {
		return await fetcher<{ detail: string }>(`/bookings/${bookingId}/cancel/`, {
			method: "POST",
		});
	},

	getVendorBookings: async () => {
		return await fetcher<GenericListResponse<IVendorBooking>>("/bookings/vendor/");
	},
};
