export enum UserRole {
	ADMIN = "admin",
	CUSTOMER = "customer",
	VENDOR = "vendor",
}

export interface User {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	full_name: string;
	role: UserRole;
	is_active: boolean;
	is_staff: boolean;
	is_superuser: boolean;
	avatar: string | null;
}
