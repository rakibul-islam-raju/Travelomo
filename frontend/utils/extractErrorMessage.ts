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
	}

	return errorMessage;
};
