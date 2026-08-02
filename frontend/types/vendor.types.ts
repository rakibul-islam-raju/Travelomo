export interface MeVendor {
	id: string;
	created_at: string;
	updated_at: string;
	store_name: string;
	tagline?: string;
	store_description?: string;
	logo?: string;
	store_email?: string;
	store_phone?: string;
	address_line_1?: string;
	address_line_2?: string;
	city?: string;
	state?: string;
	zip_code?: string;
	country?: string;
	website?: string;
	facebook?: string;
	instagram?: string;
	youtube?: string;
	tiktok?: string;
	whatsapp?: string;
	is_approved: boolean;
	approved_at?: string;
	user: string;
	approved_by?: string;
	payment_methods?: VendorPaymentMethod[];
}

export interface VendorPaymentMethod {
	id: string;
	name: string;
	account_name: string;
	account_number: string;
	instructions: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface VendorPaymentMethodInput {
	name: string;
	account_name: string;
	account_number: string;
	instructions: string;
	is_active?: boolean;
}

export interface VendorDetails {
	id: string;
	store_name: string;
	tagline: string;
	store_description: string;
	logo: string;
	store_email: string;
	store_phone: string;
	address_line_1: string;
	address_line_2: string;
	city: string;
	state: string;
	zip_code: string;
	country: string;
	website: string;
	facebook: string;
	instagram: string;
	youtube: string;
	tiktok: string;
	whatsapp: string;
	is_approved: boolean;
	approved_at: string;
	approved_by: {
		id: string;
		full_name: string;
		email: string;
		avatar?: string;
	};
	user: {
		id: string;
		full_name: string;
		email: string;
		avatar?: string;
	};
	created_at: string;
	updated_at: string;
}

export interface MeVendorResponse extends MeVendor {}

export interface IVendorSummary {
	total_completed_events: number;
	total_running_events: number;
	total_user_travelled: number;
	total_earnings: number;
}

export interface IVendorEventsPieChart {
	total_published_events: number;
	total_draft_events: number;
	total_completed_events: number;
	total_cancelled_events: number;
	total_archived_events: number;
	[key: string]: number;
}

export interface IVendorRegisteredTravelers {
	[key: string]: number;
}
