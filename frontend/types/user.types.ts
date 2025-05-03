export type IUserRole = "admin" | "customer" | "vendor";

export interface IUser {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	role: IUserRole;
	is_active: boolean;
	is_staff: boolean;
	is_superuser: boolean;
	avatar: string | null;
}
