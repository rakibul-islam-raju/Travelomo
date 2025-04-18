export interface IVendor {
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
