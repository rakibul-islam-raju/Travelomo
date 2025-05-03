import { NextResponse } from "next/server";

/**
 * Standard API error handler for Next.js route handlers
 *
 * @param error The error object caught in the try/catch block
 * @param defaultMessage Default error message if none is provided
 * @returns NextResponse with appropriate error details and status
 */
export function handleApiError(
	error: any,
	defaultMessage: string = "An error occurred"
) {
	const status = error.response?.status || 500;

	return NextResponse.json(
		{
			status,
			error: error.response?.data || {
				detail: defaultMessage,
			},
		},
		{ status }
	);
}
