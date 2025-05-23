/* eslint-disable @typescript-eslint/no-explicit-any */
import { BASE_API_URL } from "@/config";
import { extractErrorMessage } from "@/utils/extractErrorMessages";
import { toast } from "sonner";

// lib/fetcher.ts
export type FetcherOptions = {
	revalidate?: number | false; // false = no cache
	headers?: HeadersInit;
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: any;
};

const EXCLUDED_ENDPOINTS_FOR_401 = ["/auth/login/", "/auth/refresh/"];

// Mutex for preventing multiple simultaneous refresh requests
let isRefreshing = false;
let refreshPromise: Promise<{
	success: boolean;
	data: { accessToken: string; refreshToken: string };
}> | null = null;

const refreshToken = async () => {
	// If already refreshing, return the existing promise
	if (isRefreshing) {
		return refreshPromise;
	}

	isRefreshing = true;
	refreshPromise = new Promise(async (resolve, reject) => {
		try {
			const res = await fetch(`${BASE_API_URL}/auth/refresh`, {
				method: "POST",
				credentials: "include",
			});

			if (!res.ok) {
				const errorRes = await res.json();
				const errorMessage = extractErrorMessage(errorRes);
				reject(new Error(errorMessage));
				return;
			}

			const data = await res.json();
			resolve(data);
		} catch (error) {
			reject(error);
		} finally {
			isRefreshing = false;
			refreshPromise = null;
		}
	});

	return refreshPromise;
};

export async function fetcher<T = any>(
	url: string,
	options: FetcherOptions = {},
	retryCount = 0
): Promise<T> {
	const { revalidate = 0, headers, method = "GET", body } = options;
	const BASE_URL = BASE_API_URL;
	const fullUrl = `${BASE_URL}${url}`;

	try {
		const res = await fetch(fullUrl, {
			method,
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				...headers,
			},
			...(body ? { body: JSON.stringify(body) } : {}),
			// Next.js-specific cache control
			next:
				revalidate === false
					? { revalidate: 0, tags: ["no-store"] }
					: { revalidate: revalidate || 0 },
		});

		// Handle 401 Unauthorized
		if (res.status === 401 && !EXCLUDED_ENDPOINTS_FOR_401.includes(url)) {
			// Prevent infinite retry loops
			if (retryCount >= 1) {
				toast.error("Session expired. Please login again.");
				throw new Error("Authentication failed after token refresh");
			}

			try {
				const refreshResult = await refreshToken();
				if (refreshResult?.success) {
					// Retry the original request with incremented retry count
					return fetcher(url, options, retryCount + 1);
				} else {
					throw new Error("Failed to refresh token");
				}
			} catch (error) {
				toast.error("Session expired. Please login again.");
				throw error;
			}
		}

		if (!res.ok) {
			const errorRes = await res.json();
			const errorMessage = extractErrorMessage(errorRes);
			throw new Error(errorMessage);
		}

		return res.json();
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		toast.error(errorMessage);
		throw error;
	}
}
