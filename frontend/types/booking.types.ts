export interface IBookingCreate {
	event: string;
	seat_number: number;
}

export interface IBooking {
	id: string;
	event: string;
	seat_number: number;
	status: "confirmed" | "cancelled";
	total_price: number;
	can_cancel: boolean;
	event_title: string;
	event_slug: string;
	event_start_date: string;
	event_end_date: string;
	event_location: string;
	event_image: string | null;
	event_price: number;
	created_at: string;
}

export interface IVendorBooking {
	id: string;
	event: string;
	event_title: string;
	user_name: string;
	user_email: string;
	seat_number: number;
	status: "confirmed" | "cancelled";
	total_price: number;
	created_at: string;
}
