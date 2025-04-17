import { BASE_API_URL } from "@/config";
import {
	BaseQueryFn,
	createApi,
	fetchBaseQuery,
	FetchBaseQueryError,
	FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query/react";
import { getSession, signIn } from "next-auth/react";

// Define types for token refresh
interface TokenRefreshResponse {
	access: string;
	refresh: string;
}

// Define custom error type
export interface ApiError {
	status: number;
	data: any;
}

// Type guard to check if error is an ApiError
export function isApiError(error: any): error is ApiError {
	return (
		error &&
		typeof error === "object" &&
		"status" in error &&
		"data" in error &&
		typeof error.data === "object" &&
		error.data !== null &&
		"message" in error.data
	);
}

const baseQuery = fetchBaseQuery({
	baseUrl: BASE_API_URL,
	prepareHeaders: async (headers) => {
		const session = await getSession();

		if (session?.user?.tokens?.access) {
			headers.set("Authorization", `Bearer ${session.user.tokens.access}`);
		}

		headers.set("Content-Type", "application/json");
		return headers;
	},
});

const baseQueryWithRefresh: BaseQueryFn<
	| string
	| { url: string; method?: string; body?: any; params?: Record<string, any> },
	unknown,
	FetchBaseQueryError,
	{},
	FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
	let result = await baseQuery(args, api, extraOptions);

	// If unauthorized, attempt to refresh token
	if (result.error && (result.error as FetchBaseQueryError).status === 401) {
		const session = await getSession();

		if (session?.user.tokens.refresh) {
			try {
				const refreshResult = await fetch(
					`${BASE_API_URL}/auth/token/refresh/`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							refresh: session.user.tokens.refresh,
						}),
					}
				);

				if (refreshResult.ok) {
					const { access, refresh }: TokenRefreshResponse =
						await refreshResult.json();

					// Attempt to sign in with new tokens
					await signIn("credentials", {
						redirect: false,
						email: session.user.email,
						tokens: { access, refresh },
					});

					// Retry the original request with new access token
					result = await baseQuery(args, api, extraOptions);
				} else {
					// Refresh failed, force logout
					await signIn("credentials", {
						redirect: true,
						callbackUrl: "/login",
					});
				}
			} catch (error) {
				// Handle refresh error
				await signIn("credentials", { redirect: true, callbackUrl: "/login" });
			}
		}
	}

	return result;
};

export const baseApi = createApi({
	reducerPath: "baseApi",
	baseQuery: baseQueryWithRefresh,
	endpoints: () => ({}),
	tagTypes: ["Events"],
});
