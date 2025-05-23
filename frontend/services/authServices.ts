import { fetcher } from "@/lib/fetcher";
import {
	CustomerRegisterRequest,
	LoginRequest,
	LoginResponse,
	MeResponse,
	RegistrationResponse,
	VendorRegisterRequest,
} from "@/types/auth.types";

export const authServices = {
	login: async (data: LoginRequest) => {
		return await fetcher<LoginResponse>("/auth/login/", {
			method: "POST",
			body: data,
		});
	},

	register: async (data: CustomerRegisterRequest | VendorRegisterRequest) => {
		return await fetcher<RegistrationResponse>("/auth/registration/", {
			method: "POST",
			body: data,
		});
	},

	me: async () => {
		return await fetcher<MeResponse>("/auth/me/");
	},

	logout: async () => {
		return await fetcher<void>("/auth/logout/", {
			method: "POST",
		});
	},

	refresh: async () => {
		return await fetcher<void>("/auth/refresh/", {
			method: "POST",
		});
	},
};
