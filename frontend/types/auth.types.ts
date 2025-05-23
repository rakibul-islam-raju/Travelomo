import { User, UserRole } from "./user.types";

export interface LoginRequest {
	email: string;
	password: string;
}

export interface CustomerRegisterRequest {
	email: string;
	password: string;
	first_name: string;
	last_name: string;
}

export interface VendorRegisterRequest extends CustomerRegisterRequest {
	store_name: string;
}

export interface LoginResponse {
	user: User;
	access_token: string;
	refresh_token: string;
}

export interface RegistrationResponse {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	role: UserRole;
}

export interface MeResponse {
	id: string;
	avatar: string | null;
	email: string;
	first_name: string;
	last_name: string;
	role: UserRole;
	is_active: boolean;
	is_staff: boolean;
	is_superuser: boolean;
}
