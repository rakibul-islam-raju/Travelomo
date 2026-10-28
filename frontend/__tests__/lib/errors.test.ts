import { ApiError } from "@/lib/apiError";
import { fetcher } from "@/lib/fetcher";
import {
	extractErrorMessage,
	extractFieldErrors,
	NETWORK_ERROR_MESSAGE,
} from "@/utils/extractErrorMessages";
import { describe, expect, it } from "vitest";
import { jsonResponse, mockApi } from "../helpers";
import { toastMock } from "../mocks";

describe("extractErrorMessage", () => {
	it("prefers a general detail message", () => {
		expect(extractErrorMessage({ detail: "This event is sold out.", code: "sold_out" })).toBe(
			"This event is sold out."
		);
	});

	it("labels field errors and accepts list or string values", () => {
		expect(
			extractErrorMessage({
				seat_number: ["Only 2 seats are available."],
				transaction_id: "Already used.",
				non_field_errors: ["Check the form."],
			})
		).toBe("Seat number: Only 2 seats are available. Transaction id: Already used. Check the form.");
	});

	it("falls back to a status message for empty or unknown bodies", () => {
		expect(extractErrorMessage(null, 503)).toMatch(/temporarily unavailable/);
		expect(extractErrorMessage({}, 400)).toBe("Please check your details and try again.");
		expect(extractErrorMessage({ seat_number: [] })).toBe("Something went wrong. Please try again.");
	});
});

describe("extractFieldErrors", () => {
	it("flattens nested errors and skips general keys", () => {
		expect(
			extractFieldErrors({
				detail: "ignored",
				code: "ignored",
				address: { city: ["Required."] },
				seat_number: "Too many.",
			})
		).toEqual({ "address.city": ["Required."], seat_number: ["Too many."] });
	});
});

describe("fetcher", () => {
	it("throws an ApiError with status, code and field errors", async () => {
		mockApi({ "POST /bookings/": [400, { seat_number: ["Only 1 seat is available."] }] });

		const error = await fetcher("/bookings/", { method: "POST", body: {} }).catch((e) => e);

		expect(error).toBeInstanceOf(ApiError);
		expect(error.status).toBe(400);
		expect(error.fieldErrors).toEqual({ seat_number: ["Only 1 seat is available."] });
		expect(toastMock.error).toHaveBeenCalledTimes(1);
	});

	it("keeps the response code for general errors", async () => {
		mockApi({ "POST /bookings/b-1/cancel/": [409, { detail: "Already cancelled.", code: "already_cancelled" }] });

		const error = await fetcher("/bookings/b-1/cancel/", { method: "POST" }).catch((e) => e);

		expect(error.code).toBe("already_cancelled");
		expect(error.message).toBe("Already cancelled.");
	});

	it("does not toast when silent", async () => {
		mockApi({ "GET /bookings/my/": [500, { detail: "Boom" }] });

		await expect(fetcher("/bookings/my/", { silent: true })).rejects.toThrow("Boom");
		expect(toastMock.error).not.toHaveBeenCalled();
	});

	it("turns a failed connection into a network ApiError", async () => {
		mockApi({ "GET /bookings/my/": "network-error" });

		const error = await fetcher("/bookings/my/", { silent: true }).catch((e) => e);

		expect(error.isNetworkError).toBe(true);
		expect(error.message).toBe(NETWORK_ERROR_MESSAGE);
	});

	it("handles non-JSON error pages", async () => {
		mockApi({
			"GET /bookings/my/": () =>
				new Response("<html>Bad gateway</html>", { status: 502, headers: { "Content-Type": "text/html" } }),
		});

		const error = await fetcher("/bookings/my/", { silent: true }).catch((e) => e);

		expect(error.status).toBe(502);
		expect(error.message).toMatch(/temporarily unavailable/);
	});

	it("returns undefined for 204 responses", async () => {
		mockApi({ "DELETE /vendors/payment-methods/pm-1/": () => jsonResponse(204) });

		await expect(
			fetcher("/vendors/payment-methods/pm-1/", { method: "DELETE" })
		).resolves.toBeUndefined();
	});
});
