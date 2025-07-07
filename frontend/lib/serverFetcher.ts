/* eslint-disable @typescript-eslint/no-explicit-any */

import { BASE_API_URL } from "@/config";
import { cookies } from "next/headers";

export type FetcherOptions = {
	revalidate?: number | false;
	headers?: HeadersInit;
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: any;
};

export const serverFetcher = async <T = any>(
	url: string,
	options: FetcherOptions = {}
): Promise<T> => {
	const BASE_URL = BASE_API_URL;
	const fullUrl = `${BASE_URL}${url}`;

	const { method = "GET", headers, body } = options;

	const cookieStore = await cookies();
	const token = cookieStore.get("access")?.value;

	const res = await fetch(fullUrl, {
		method,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			...(headers || {}),
		},
		// only send body if method is not GET
		...(method !== "GET" && body ? { body: JSON.stringify(body) } : {}),
	});

	if (!res.ok) {
		console.error(`❌ Fetch error: ${res.status} ${res.statusText}`);
		throw new Error(`Failed to fetch: ${res.status}`);
	}

	return await res.json();
};
