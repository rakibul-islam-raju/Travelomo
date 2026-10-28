/* eslint-disable @typescript-eslint/no-explicit-any */

// Error bodies follow API_CONTRACT.md §2: either { detail, code? } or
// { <field>: string[], non_field_errors: string[] }. Field values may still be
// plain strings on older endpoints, so both forms are accepted.

export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
export const NETWORK_ERROR_MESSAGE =
	"We couldn't reach Travelomo. Check your connection and try again.";

const STATUS_MESSAGES: Record<number, string> = {
	0: NETWORK_ERROR_MESSAGE,
	400: "Please check your details and try again.",
	401: "Please log in to continue.",
	403: "You don't have permission to do that.",
	404: "We couldn't find what you were looking for.",
	409: "This changed in the meantime. Refresh and try again.",
	429: "Too many attempts. Please wait a moment and try again.",
	500: "Something went wrong on our side. Please try again.",
	502: "Travelomo is temporarily unavailable. Please try again shortly.",
	503: "Travelomo is temporarily unavailable. Please try again shortly.",
	504: "Travelomo is temporarily unavailable. Please try again shortly.",
};

const GENERAL_ERROR_KEYS = ["detail", "msg", "message", "error"];
const NON_FIELD_ERRORS = "non_field_errors";

export const getStatusMessage = (status?: number): string =>
	(status !== undefined && STATUS_MESSAGES[status]) || DEFAULT_ERROR_MESSAGE;

const toMessages = (value: unknown): string[] => {
	if (typeof value === "string") return value ? [value] : [];
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === "string");
	}
	return [];
};

/** Field errors keyed by field name; nested serializer errors use "parent.child". */
export const extractFieldErrors = (
	error: any,
	prefix = ""
): Record<string, string[]> => {
	if (!error || typeof error !== "object" || Array.isArray(error)) return {};

	const fieldErrors: Record<string, string[]> = {};
	for (const [key, value] of Object.entries(error)) {
		if (!prefix && (GENERAL_ERROR_KEYS.includes(key) || key === "code")) continue;
		const path = prefix ? `${prefix}.${key}` : key;

		if (value && typeof value === "object" && !Array.isArray(value)) {
			Object.assign(fieldErrors, extractFieldErrors(value, path));
			continue;
		}
		const messages = toMessages(value);
		if (messages.length) fieldErrors[path] = messages;
	}
	return fieldErrors;
};

const fieldLabel = (path: string) => {
	const label = path.split(".").pop()!.replace(/_/g, " ");
	return label.charAt(0).toUpperCase() + label.slice(1);
};

export const extractErrorMessage = (error: any, status?: number): string => {
	if (typeof error === "string") return error || getStatusMessage(status);
	if (error instanceof Error) return error.message || getStatusMessage(status);
	if (Array.isArray(error)) {
		return toMessages(error).join(" ") || getStatusMessage(status);
	}

	if (error && typeof error === "object") {
		for (const key of GENERAL_ERROR_KEYS) {
			const [message] = toMessages(error[key]);
			if (message) return message;
		}

		const messages = Object.entries(extractFieldErrors(error)).flatMap(
			([path, fieldMessages]) =>
				path === NON_FIELD_ERRORS
					? fieldMessages
					: fieldMessages.map((message) => `${fieldLabel(path)}: ${message}`)
		);
		if (messages.length) return messages.join(" ");
	}

	return getStatusMessage(status);
};
