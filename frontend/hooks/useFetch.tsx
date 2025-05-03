"use client";

import { extractErrorMessage } from "@/utils/extractErrorMessages";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function useFetch(key?: string) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<any>(null);
	const [status, setStatus] = useState<number | null>(null);
	const [isSuccess, setIsSuccess] = useState<boolean>(false);

	const fetchData = async ({
		url,
		method,
		body,
		params,
		headers,
		showErrorToast = true,
	}: {
		url: string;
		method: "POST" | "GET";
		body?: any;
		params?: Record<string, string>;
		headers?: Record<string, string>;
		showErrorToast?: boolean;
	}) => {
		let URL = url;

		if (params) {
			const queryParams = new URLSearchParams(params);
			URL += `?${queryParams.toString()}`;
		}

		startTransition(async () => {
			try {
				const response = await fetch(URL, {
					method,
					body: method === "POST" ? JSON.stringify(body) : undefined,
					headers: {
						"Content-Type": "application/json",
						...headers,
					},
				});

				const responseData = await response.json();

				// Handle the consistent response format from our API routes
				if (responseData.error) {
					// Our API routes return error data in a consistent format
					setStatus(responseData.status);
					const errorMessage = extractErrorMessage(responseData.error);
					setError(errorMessage);
					if (showErrorToast) {
						toast.error(errorMessage);
					}
					return;
				}

				// Set status and data for successful responses
				setStatus(responseData.status);
				setData(responseData.data);
				setIsSuccess(true);
				setError(null);
			} catch (error: any) {
				console.error("Fetch error:", error);
				const errorMessage =
					extractErrorMessage(error) || "An unexpected error occurred";
				setError(errorMessage);
				if (showErrorToast) {
					toast.error(errorMessage);
				}
			}
		});
	};

	return { isPending, error, data, status, fetchData, key, isSuccess };
}
