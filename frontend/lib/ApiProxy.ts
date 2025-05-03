import { BASE_API_URL, COOKIE_CONSTS } from "@/config";
import { cookies } from "next/headers";

export default class ApiProxy {
	static BASE_URL = BASE_API_URL;

	static async getHeaders() {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get(COOKIE_CONSTS.ACCESS_TOKEN)?.value;
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		if (accessToken) {
			headers.Authorization = `Bearer ${accessToken}`;
		}

		return headers;
	}

	static async handleResponse(response: Response) {
		const status = response.status;

		try {
			const data = await response.json();

			// If the response is not ok, throw an error with the response data
			if (!response.ok) {
				const error: any = new Error(`API error with status ${status}`);
				error.response = {
					status,
					data,
				};
				throw error;
			}

			return { data, status };
		} catch (error: any) {
			// If error parsing JSON or other error
			if (!error.response) {
				const newError: any = new Error(`API error with status ${status}`);
				newError.response = {
					status,
					data: { detail: response.statusText || "Unknown error" },
				};
				throw newError;
			}
			throw error;
		}
	}

	static async post(
		path: string,
		body: any
	): Promise<{ data: any; status: number }> {
		try {
			const headers = await this.getHeaders();
			const response = await fetch(`${this.BASE_URL}${path}`, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});

			return await this.handleResponse(response);
		} catch (error) {
			console.error(`Error in POST ${path}:`, error);
			throw error;
		}
	}

	static async get(path: string): Promise<{ data: any; status: number }> {
		try {
			const headers = await this.getHeaders();
			const response = await fetch(`${this.BASE_URL}${path}`, {
				headers,
			});

			return await this.handleResponse(response);
		} catch (error) {
			console.error(`Error in GET ${path}:`, error);
			throw error;
		}
	}
}
