import { ForgetPasswordFormValues } from "@/app/(client)/(auth)/forget-password/_componemts/schema";
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

	register: async (
		data: CustomerRegisterRequest | VendorRegisterRequest,
		type: "customer" | "vendor"
	) => {
		const url =
			type === "customer"
				? "/auth/register/customer/"
				: "/auth/register/vendor/";
		return await fetcher<RegistrationResponse>(url, {
			method: "POST",
			body: data,
		});
	},

	me: async () => {
		return await fetcher<MeResponse>("/auth/me/");
	},

	logout: async () => {
		return await fetcher("/auth/logout/", {
			method: "POST",
		});
	},

	refresh: async () => {
		return await fetcher<{ access: string; refresh: string }>(
			"/auth/refresh/",
			{
				method: "POST",
			}
		);
	},

	forgetPassword: async (data: ForgetPasswordFormValues) => {
		return await fetcher("/auth/forget-password/", {
			method: "POST",
			body: data,
		});
	},

	activateAccount: async (data: { email: string; token: string }) => {
		return await fetcher("/auth/activate-account/", {
			method: "POST",
			body: data,
		});
	},
};
