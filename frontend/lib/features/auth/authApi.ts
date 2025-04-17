import { baseApi } from "@/lib/baseApi";

// Define types for registration requests
interface CustomerRegistrationRequest {
	first_name: string;
	last_name: string;
	email: string;
	password: string;
}

interface VendorRegistrationRequest {
	first_name: string;
	last_name: string;
	store_name: string;
	email: string;
	password: string;
}

// Define types for registration responses
interface RegistrationResponse {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	role: string;
}

export const authApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		// Customer registration endpoint
		registerCustomer: builder.mutation<
			RegistrationResponse,
			CustomerRegistrationRequest
		>({
			query: (credentials) => ({
				url: "/auth/register/customer/",
				method: "POST",
				body: credentials,
			}),
		}),

		// Vendor registration endpoint
		registerVendor: builder.mutation<
			RegistrationResponse,
			VendorRegistrationRequest
		>({
			query: (credentials) => ({
				url: "/auth/register/vendor/",
				method: "POST",
				body: credentials,
			}),
		}),

		activateAccount: builder.mutation<
			{ message: string },
			{ email: string; token: string }
		>({
			query: ({ email, token }) => ({
				url: `/auth/activate-account/?email=${email}&token=${token}`,
				method: "GET",
			}),
		}),
	}),
});

export const {
	useRegisterCustomerMutation,
	useRegisterVendorMutation,
	useActivateAccountMutation,
} = authApi;
