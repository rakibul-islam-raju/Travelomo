export const extractErrorMessage = (error: any): string => {
	let errorMessage = "Something went wrong";

	if (error?.detail) {
		errorMessage = error.detail;
	} else if (error?.msg) {
		errorMessage = error.msg;
	} else if (error?.message) {
		errorMessage = error.message;
	} else if (error?.error) {
		errorMessage = error.error;
	} else if (error?.non_field_errors) {
		errorMessage = error.non_field_errors;
	} else if (Array.isArray(error)) {
		const errors = error.filter((err: any) => typeof err === "string");
		errorMessage = errors.join(", ");
	} else if (typeof error === "object") {
		const errors = [];
		for (const key in error) {
			if (Array.isArray(error[key])) {
				const fieldErrors = error[key].map(
					(msg) => `${key.toUpperCase()}: ${msg}`
				);
				errors.push(...fieldErrors);
			}
		}
		errorMessage = errors.join(", ");
	} else if (error?.status === 400) {
		errorMessage = "Bad Request";
	} else if (error?.status === 401) {
		errorMessage = "Unauthorized";
	} else if (error?.status === 403) {
		errorMessage = "Forbidden";
	} else if (error?.status === 404) {
		errorMessage = "Not Found";
	} else if (error?.status === 405) {
		errorMessage = "Method Not Allowed";
	} else if (error?.status === 408) {
		errorMessage = "Request Timeout";
	} else if (error?.status === 409) {
		errorMessage = "Conflict";
	} else if (error?.status === 413) {
		errorMessage = "Payload Too Large";
	} else if (error?.status === 414) {
		errorMessage = "URI Too Long";
	} else if (error?.status === 415) {
		errorMessage = "Unsupported Media Type";
	} else if (error?.status === 500) {
		errorMessage = "Internal Server Error";
	} else if (error?.status === 501) {
		errorMessage = "Not Implemented";
	} else if (error?.status === 502) {
		errorMessage = "Bad Gateway";
	} else if (error?.status === 503) {
		errorMessage = "Service Unavailable";
	} else if (error?.status === 504) {
		errorMessage = "Gateway Timeout";
	} else if (typeof error === "string") {
		errorMessage = error;
	}

	return errorMessage;
};
