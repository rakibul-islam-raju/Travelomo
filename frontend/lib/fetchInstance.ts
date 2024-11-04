import { BASE_API_URL } from "@/config";
import { tokenService } from "@/services/tokenService";
import { AuthTokens } from "@/types/common";

const refreshAccessToken = async (): Promise<boolean> => {
	const authTokens = tokenService.getAuthTokens();
	if (!authTokens?.refresh) return false;

	try {
		const response = await fetch(`${BASE_API_URL}/refresh-token`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${authTokens.refresh}`,
			},
		});

		if (!response.ok) throw new Error("Failed to refresh token");

		const newTokens: AuthTokens = await response.json();
		tokenService.setAuthTokens(newTokens);
		return true;
	} catch (error) {
		console.error("Error refreshing token:", error);
		tokenService.clearAuthTokens();
		return false;
	}
};

const createFetchInstance = (baseUrl: string) => {
	return async (endpoint: string, options: RequestInit = {}): Promise<any> => {
		const url = `${baseUrl}${endpoint}`;
		const defaultOptions: RequestInit = {
			headers: {
				"Content-Type": "application/json",
			},
		};

		const authTokens = tokenService.getAuthTokens();
		if (authTokens?.access) {
			defaultOptions.headers = {
				...defaultOptions.headers,
				Authorization: `Bearer ${authTokens.access}`,
			};
		}

		const mergedOptions = { ...defaultOptions, ...options };

		try {
			const response = await fetch(url, mergedOptions);

			if (response.status === 401) {
				// Token might be expired, try to refresh
				const refreshed = await refreshAccessToken();
				if (refreshed) {
					// Retry the original request with the new token
					const newAuthTokens = tokenService.getAuthTokens();
					mergedOptions.headers = {
						...mergedOptions.headers,
						Authorization: `Bearer ${newAuthTokens!.access}`,
					};
					return fetch(url, mergedOptions).then((res) => res.json());
				} else {
					throw new Error("Unable to refresh token");
				}
			}

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.message || `HTTP error! status: ${response.status}`
				);
			}

			return response.json();
		} catch (error) {
			throw error;
		}
	};
};

// Create an instance of the fetch function with the base URL
export const apiFetch = createFetchInstance(BASE_API_URL);
