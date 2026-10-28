import MyBookingsPage from "@/app/(client)/my-bookings/page";
import { IBooking } from "@/types/booking.types";
import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { listPage, makeBooking, mockApi, pendingBooking, renderWithClient } from "../helpers";

const LIST_PATH = "/bookings/my/";

const confirmed = (overrides: Partial<IBooking> = {}) =>
	pendingBooking({
		id: "b-confirmed",
		booking_reference: "TL-CONF01",
		status: "confirmed",
		status_label: "Confirmed",
		...overrides,
	});

describe("MyBookingsPage", () => {
	it("shows a loading state, then the empty state", async () => {
		mockApi({ [`GET ${LIST_PATH}`]: [200, listPage([])] });
		renderWithClient(<MyBookingsPage />);

		expect(screen.getByLabelText("Loading bookings")).toBeInTheDocument();
		expect(await screen.findByText("No bookings yet")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /explore events/i })).toHaveAttribute("href", "/events");
	});

	it("shows the load error and recovers on retry", async () => {
		let attempts = 0;
		mockApi({
			[`GET ${LIST_PATH}`]: () =>
				++attempts === 1 ? "network-error" : [200, listPage([confirmed()])],
		});
		const { user } = renderWithClient(<MyBookingsPage />);

		expect(await screen.findByText("We couldn't load your bookings")).toBeInTheDocument();
		expect(screen.getByText(/couldn't reach travelomo/i)).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /try again/i }));
		expect(await screen.findByText("TL-CONF01")).toBeInTheDocument();
	});

	it("explains when a confirmed booking can no longer be cancelled", async () => {
		mockApi({ [`GET ${LIST_PATH}`]: [200, listPage([confirmed({ can_cancel: false })])] });
		renderWithClient(<MyBookingsPage />);

		expect(await screen.findByText(/cancellation is closed for this booking/i)).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /cancel booking/i })).not.toBeInTheDocument();
	});

	it("shows cancelled and rejected bookings without actions", async () => {
		mockApi({
			[`GET ${LIST_PATH}`]: [
				200,
				listPage([
					confirmed({ id: "b-x", status: "cancelled", status_label: "Cancelled", can_cancel: false }),
					confirmed({
						id: "b-y",
						status: "payment_rejected",
						status_label: "Payment rejected",
						can_cancel: false,
						payment_submission: { ...pendingBooking().payment_submission!, status: "rejected", rejection_reason: "Not received" },
					}),
				]),
			],
		});
		renderWithClient(<MyBookingsPage />);

		expect(await screen.findByText(/this booking was cancelled/i)).toBeInTheDocument();
		expect(screen.getByText("Reason: Not received")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
	});

	it("cancels through the confirmation dialog and reloads the list", async () => {
		let cancelled = false;
		const api = mockApi({
			[`GET ${LIST_PATH}`]: () => [
				200,
				listPage([
					cancelled
						? confirmed({ status: "cancelled", status_label: "Cancelled", can_cancel: false })
						: confirmed(),
				]),
			],
			"POST /bookings/b-confirmed/cancel/": () => {
				cancelled = true;
				return [200, { detail: "Booking cancelled successfully." }];
			},
		});
		const { user } = renderWithClient(<MyBookingsPage />);

		await user.click(await screen.findByRole("button", { name: /cancel booking/i }));
		const dialog = screen.getByRole("dialog");
		expect(within(dialog).getByText("Cancel this confirmed booking?")).toBeInTheDocument();
		await user.click(within(dialog).getByRole("button", { name: /yes, cancel/i }));

		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		expect(await screen.findByText(/this booking was cancelled/i)).toBeInTheDocument();
		expect(api.count("GET", LIST_PATH)).toBe(2);
	});

	it("confirms before cancelling an unpaid reservation", async () => {
		const api = mockApi({ [`GET ${LIST_PATH}`]: [200, listPage([makeBooking()])] });
		const { user } = renderWithClient(<MyBookingsPage />);

		await user.click(await screen.findByRole("button", { name: /cancel reservation/i }));

		expect(screen.getByRole("dialog")).toHaveTextContent("Cancel this reservation?");
		expect(api.count("POST", "/bookings/b-1/cancel/")).toBe(0);
	});

	it("loads further pages on request", async () => {
		const page = (offset: number, size: number) =>
			Array.from({ length: size }, (_, index) =>
				confirmed({ id: `b-${offset + index}`, booking_reference: `TL-${offset + index}` })
			);
		const api = mockApi({
			[`GET ${LIST_PATH}`]: ({ query }) =>
				query.get("offset") === "0"
					? [200, listPage(page(0, 10), { count: 12, next: "http://api/bookings/my/?offset=10" })]
					: [200, listPage(page(10, 2), { count: 12 })],
		});
		const { user } = renderWithClient(<MyBookingsPage />);

		expect(await screen.findByText("Showing 10 of 12 bookings")).toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: /load more bookings/i }));

		expect(await screen.findByText("Showing 12 of 12 bookings")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /load more bookings/i })).not.toBeInTheDocument();
		expect(api.requests.map((r) => [r.query.get("limit"), r.query.get("offset")])).toEqual([
			["10", "0"],
			["10", "10"],
		]);
	});
});
