/* eslint-disable @typescript-eslint/no-explicit-any */
import { BASE_API_URL } from "@/config";
import { ApiError, isApiError } from "@/lib/apiError";
import { extractErrorMessage } from "@/utils/extractErrorMessages";
import { toast } from "sonner";

type Params = {
	[key: string]: string;
};

// lib/fetcher.ts
export type FetcherOptions = {
	revalidate?: number | false; // false = no cache
	headers?: HeadersInit;
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: any;
	params?: Params;
	/** Skip the error toast because the caller shows the error itself. */
	silent?: boolean;
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

const sessionExpired = () =>
	new ApiError("Your session has expired. Please log in again.", {
		status: 401,
		code: "session_expired",
	});

// Error bodies may be empty or HTML (e.g. a gateway 502), not just JSON.
const readErrorBody = async (res: Response) => {
	try {
		const text = await res.text();
		return text ? JSON.parse(text) : null;
	} catch {
		return null;
	}
};

async function request<T>(
	url: string,
	options: FetcherOptions,
	retryCount: number
): Promise<T> {
	const { revalidate = 0, headers, method = "GET", body } = options;
	const BASE_URL = BASE_API_URL;
	const qParams = new URLSearchParams(options.params).toString();
	const fullUrl = qParams
		? `${BASE_URL}${url}?${qParams}`
		: `${BASE_URL}${url}`;

	let res: Response;
	try {
		res = await fetch(fullUrl, {
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
		} as RequestInit);
	} catch {
		throw ApiError.network();
	}

	// Handle 401 Unauthorized
	if (res.status === 401 && !EXCLUDED_ENDPOINTS_FOR_401.includes(url)) {
		// Prevent infinite retry loops
		if (retryCount >= 1) {
			throw sessionExpired();
		}

		let refreshResult;
		try {
			refreshResult = await refreshToken();
		} catch {
			throw sessionExpired();
		}
		if (!refreshResult?.success) {
			throw sessionExpired();
		}
		// Retry the original request with incremented retry count
		return fetcher<T>(url, options, retryCount + 1);
	}

	if (!res.ok) {
		throw ApiError.fromResponse(res.status, await readErrorBody(res));
	}

	if (res.status === 204) {
		return undefined as T;
	}

	return res.json();
}

/**
 * Client-side API request. Failures are thrown as `ApiError` and shown in a
 * toast unless `silent` is set.
 */
export async function fetcher<T = any>(
	url: string,
	options: FetcherOptions = {},
	retryCount = 0
): Promise<T> {
	try {
		return await request<T>(url, options, retryCount);
	} catch (error) {
		const apiError = isApiError(error)
			? error
			: new ApiError(extractErrorMessage(error), { status: 0 });
		// A retried request reports through the original call, so each failure toasts once.
		if (!options.silent && retryCount === 0) {
			toast.error(apiError.message);
		}
		throw apiError;
	}
}
