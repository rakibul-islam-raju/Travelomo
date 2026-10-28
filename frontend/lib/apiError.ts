/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	extractErrorMessage,
	extractFieldErrors,
	NETWORK_ERROR_MESSAGE,
} from "@/utils/extractErrorMessages";

type ApiErrorInit = {
	status: number;
	code?: string;
	fieldErrors?: Record<string, string[]>;
	body?: unknown;
};

/** An API failure with the parts of the response the UI can act on. */
export class ApiError extends Error {
	/** HTTP status, or 0 when the request never reached the server. */
	readonly status: number;
	/** Machine-readable `code` from the response (API_CONTRACT.md §2.1). */
	readonly code?: string;
	readonly fieldErrors: Record<string, string[]>;
	readonly body?: unknown;

	constructor(message: string, { status, code, fieldErrors = {}, body }: ApiErrorInit) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
		this.fieldErrors = fieldErrors;
		this.body = body;
	}

	get isNetworkError() {
		return this.code === "network_error";
	}

	static fromResponse(status: number, body: any) {
		return new ApiError(extractErrorMessage(body, status), {
			status,
			code: typeof body?.code === "string" ? body.code : undefined,
			fieldErrors: extractFieldErrors(body),
			body,
		});
	}

	static network() {
		return new ApiError(NETWORK_ERROR_MESSAGE, {
			status: 0,
			code: "network_error",
		});
	}
}

export const isApiError = (error: unknown): error is ApiError =>
	error instanceof ApiError;

export const getErrorMessage = (error: unknown) =>
	isApiError(error) ? error.message : extractErrorMessage(error);
