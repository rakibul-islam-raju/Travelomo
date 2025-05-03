import { extractErrorMessage } from "@/utils/extractErrorMessages";
import axios from "axios";
import { toast } from "sonner";

const internalApi = axios.create({
	baseURL: "/api",
	headers: {
		"Content-Type": "application/json",
	},
});

// Response interceptor for handling errors globally
internalApi.interceptors.response.use(
	(response) => response, // Return successful responses as-is
	(error) => {
		// Extract and show error message in toast
		const errorMessage = extractErrorMessage(error?.response?.data?.error);
		toast.error(errorMessage);

		// Propagate the error for component-level handling if needed
		return Promise.reject(error);
	}
);

export { internalApi };
