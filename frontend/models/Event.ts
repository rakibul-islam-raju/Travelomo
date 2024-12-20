import { GenericListParams } from "@/types/common";

export interface IEventVendor {
	id: number;
	store_name: string;
	logo?: string;
}

export interface IEventListParams extends GenericListParams {
	start_price?: number;
	end_price?: number;
	start_date?: string;
	end_date?: string;
	seat_available?: string;
}

export interface IEventListItem {
	id: string;
	vendor: IEventVendor;
	title: string;
	slug: string;
	start_date: string;
	end_date: string;
	location: string;
	seat_available: number;
	actual_price: string;
	discount_price?: string | null;
	image?: string | null;
	tags?: string | null;
	is_featured: boolean;
	price: string;
}

export interface IEvent {
	id: string;
	vendor: IEventVendor;
	title: string;
	slug: string;
	description: string;
	start_date: string;
	end_date: string;
	location: string;
	seat_available: number;
	actual_price: string;
	discount_price?: string | null;
	image?: string | null;
	features: string[];
	tags?: string | null;
	is_featured: boolean;
	is_published: boolean;
	is_deleted: boolean;
	is_archived: boolean;
	price: string;
}
