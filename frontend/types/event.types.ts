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
