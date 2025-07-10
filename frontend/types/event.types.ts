export interface IVendorEventListItem {
	id: string;
	title: string;
	slug: string;
	start_date: string;
	end_date: string;
	location: string;
	available_seats: number;
	actual_price: string;
	discount_price: string;
	image: string;
	is_featured: boolean;
	status: string;
	seat_booked: number;
	total_seats: number;
}

export interface ICreateEvent {
	title: string;
	slug?: string;
	description: string;
	start_date: string;
	end_date: string;
	location: string;
	available_seats?: number;
	actual_price: number;
	discount_price: number;
	tags?: string;
	image?: string;
	is_featured?: boolean;
	status: string;
}

export interface IEventFilter {
	start_date?: string;
	end_date?: string;
	available_seats?: string;
	start_price?: string;
	end_price?: string;
}

export interface IVendorEventDetails {
	id: string;
	created_at: string;
	updated_at: string;
	title: string;
	slug: string;
	description: string;
	start_date: string;
	end_date: string;
	location: string;
	total_seats: number;
	available_seats: number;
	actual_price: number;
	discount_price: number;
	image: string;
	tags: string;
	status: string;
	is_featured: boolean;
	is_archived: boolean;
	vendor: string;
	seat_booked: number;
}
