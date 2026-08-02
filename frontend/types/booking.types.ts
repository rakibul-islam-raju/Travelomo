export interface IBookingCreate {
	event: string;
	seat_number: number;
}

export type BookingStatus =
	| "awaiting_payment_reference"
	| "pending_verification"
	| "confirmed"
	| "payment_rejected"
	| "expired"
	| "cancelled";

export interface IPaymentMethod {
	id: string;
	name: string;
	account_name: string;
	account_number: string;
	instructions: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface IPaymentSubmission {
	id: string;
	payment_method: string;
	payment_method_name: string;
	transaction_id: string;
	status: "pending" | "verified" | "rejected";
	reviewed_by_name: string | null;
	reviewed_at: string | null;
	rejection_reason: string;
	created_at: string;
}

export interface IBooking {
	id: string;
	event: string;
	booking_reference: string;
	seat_number: number;
	status: BookingStatus;
	status_label: string;
	total_price: string;
	currency: string;
	can_cancel: boolean;
	payment_reference_expires_at: string | null;
	verification_expires_at: string | null;
	cancelled_at: string | null;
	event_title: string;
	event_slug: string;
	event_start_date: string;
	event_end_date: string;
	event_location: string;
	event_image: string | null;
	event_price: string;
	payment_submission: IPaymentSubmission | null;
	payment_methods: IPaymentMethod[];
	created_at: string;
}

export interface IVendorBooking {
	id: string;
	booking_reference: string;
	event: string;
	event_title: string;
	user_name: string;
	user_email: string;
	seat_number: number;
	status: BookingStatus;
	status_label: string;
	total_price: string;
	currency: string;
	payment_reference_expires_at: string | null;
	verification_expires_at: string | null;
	payment_submission: IPaymentSubmission | null;
	created_at: string;
}

export interface IPaymentMethodInput {
	name: string;
	account_name: string;
	account_number: string;
	instructions: string;
	is_active?: boolean;
}
