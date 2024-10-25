export type EventListItem = {
	id: string;
	title: string;
	start_date: string;
	end_date: string;
	location: string;
	seat_available: number;
	actual_price: string;
	price: string;
	created_at: string;
	slug?: string;
	discount_price?: string;
	image?: string | null;
	is_featured?: boolean;
	tags?: string | null;
	vendor: {
		id: string;
		store_name: string;
		logo?: string | null;
	};
};
