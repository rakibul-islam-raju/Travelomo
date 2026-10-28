import BookingSidebar from "@/app/(client)/events/[eventId]/[eventSlug]/_components/BookingSidebar";
import { UserRole } from "@/types/user.types";
import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
	deferredReply,
	makeBooking,
	mockApi,
	pendingBooking,
	renderWithClient,
	signInAs,
} from "../helpers";
import { navigationState, routerMock, toastMock } from "../mocks";

const EVENT_PATH = "/events/e-1/";

function renderSidebar(props: Partial<Parameters<typeof BookingSidebar>[0]> = {}) {
	return renderWithClient(
		<BookingSidebar
			eventId="e-1"
			availableSeats={5}
			price="1200.00"
			cancellationDays={2}
			{...props}
		/>
	);
}

async function openDialog(user: ReturnType<typeof renderSidebar>["user"]) {
	await user.click(screen.getByRole("button", { name: /reserve & book/i }));
	return screen.findByRole("dialog");
}

describe("BookingSidebar", () => {
	beforeEach(() => {
		navigationState.pathname = "/events/e-1/sundarbans-weekend";
	});

	describe("before booking", () => {
		it("sends signed-out visitors to login with the event as return URL", async () => {
			const api = mockApi({});
			const { user } = renderSidebar();

			await user.click(screen.getByRole("button", { name: /reserve & book/i }));

			expect(routerMock.push).toHaveBeenCalledWith(
				"/login?callbackUrl=%2Fevents%2Fe-1%2Fsundarbans-weekend"
			);
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			expect(api.requests).toHaveLength(0);
		});

		it("shows a disabled sold-out state", () => {
			signInAs();
			renderSidebar({ availableSeats: 0 });

			expect(screen.getByRole("button", { name: /sold out/i })).toBeDisabled();
			expect(screen.getByText(/all seats are booked right now/i)).toBeInTheDocument();
		});

		it("explains why an event cannot be booked", () => {
			signInAs();
			renderSidebar({ unavailableReason: "Booking has closed because this event has started." });

			expect(screen.getByRole("button", { name: /not available/i })).toBeDisabled();
			expect(screen.getByText(/this event has started/i)).toBeInTheDocument();
		});

		it("tells vendor accounts that booking is for customers", () => {
			signInAs(UserRole.VENDOR);
			renderSidebar();

			expect(screen.getByRole("button", { name: /customers only/i })).toBeDisabled();
		});
	});

	describe("choosing seats", () => {
		it("refetches availability on open and validates against it", async () => {
			signInAs();
			mockApi({ [`GET ${EVENT_PATH}`]: [200, { id: "e-1", available_seats: 2 }] });
			const { user } = renderSidebar();

			const dialog = await openDialog(user);
			expect(await within(dialog).findByText("2 seats currently available")).toBeInTheDocument();

			const input = within(dialog).getByLabelText(/how many seats/i);
			await user.clear(input);
			await user.type(input, "3");

			expect(within(dialog).getByText("Only 2 seats are left.")).toBeInTheDocument();
			expect(within(dialog).getByRole("button", { name: /hold seats/i })).toBeDisabled();
		});

		it("rejects empty and over-limit seat counts", async () => {
			signInAs();
			mockApi({ [`GET ${EVENT_PATH}`]: [200, { id: "e-1", available_seats: 150 }] });
			const { user } = renderSidebar({ availableSeats: 150 });

			const dialog = await openDialog(user);
			const input = within(dialog).getByLabelText(/how many seats/i);

			await user.clear(input);
			expect(within(dialog).getByText("Enter how many seats you need.")).toBeInTheDocument();

			await user.type(input, "101");
			expect(within(dialog).getByText(/up to 100 seats/i)).toBeInTheDocument();
			expect(within(dialog).getByRole("button", { name: /hold seats/i })).toBeDisabled();
		});
	});

	describe("reservation errors", () => {
		it("shows a sold-out API error in the dialog and refreshes availability", async () => {
			signInAs();
			let seats = 5;
			const api = mockApi({
				[`GET ${EVENT_PATH}`]: () => [200, { id: "e-1", available_seats: seats }],
				"POST /bookings/": () => {
					seats = 0;
					return [400, { detail: "This event is sold out.", code: "sold_out" }];
				},
			});
			const { user } = renderSidebar();

			const dialog = await openDialog(user);
			await user.click(within(dialog).getByRole("button", { name: /hold seats/i }));

			expect(await within(dialog).findByText("This event is sold out.")).toBeInTheDocument();
			await waitFor(() => expect(api.count("GET", EVENT_PATH)).toBe(2));
			expect(within(dialog).getByRole("button", { name: /hold seats/i })).toBeDisabled();
			// The trigger behind the open modal is hidden from the accessibility tree.
			expect(screen.getByRole("button", { name: /sold out/i, hidden: true })).toBeDisabled();
			expect(routerMock.refresh).toHaveBeenCalled();
			expect(toastMock.error).not.toHaveBeenCalled();
		});

		it("shows a seat_number field error under the seat input", async () => {
			signInAs();
			mockApi({
				[`GET ${EVENT_PATH}`]: [200, { id: "e-1", available_seats: 5 }],
				"POST /bookings/": [400, { seat_number: ["Only 1 seat is available."] }],
			});
			const { user } = renderSidebar();

			const dialog = await openDialog(user);
			await user.click(within(dialog).getByRole("button", { name: /hold seats/i }));

			expect(await within(dialog).findByText("Only 1 seat is available.")).toBeInTheDocument();
			expect(within(dialog).getByLabelText(/how many seats/i)).toHaveAttribute("aria-invalid", "true");
		});

		it("links to My Bookings when an unfinished reservation exists", async () => {
			signInAs();
			const message =
				"You already have a reservation for this event that is waiting for payment or verification. Finish or cancel it in My Bookings before booking again.";
			mockApi({
				[`GET ${EVENT_PATH}`]: [200, { id: "e-1", available_seats: 5 }],
				"POST /bookings/": [409, { detail: message, code: "unfinished_booking_exists" }],
			});
			const { user } = renderSidebar();

			const dialog = await openDialog(user);
			await user.click(within(dialog).getByRole("button", { name: /hold seats/i }));

			expect(await within(dialog).findByText(message)).toBeInTheDocument();
			expect(within(dialog).getByRole("link", { name: /go to my bookings/i })).toHaveAttribute(
				"href",
				"/my-bookings"
			);
		});

		it("shows a network failure in the dialog", async () => {
			signInAs();
			mockApi({
				[`GET ${EVENT_PATH}`]: [200, { id: "e-1", available_seats: 5 }],
				"POST /bookings/": "network-error",
			});
			const { user } = renderSidebar();

			const dialog = await openDialog(user);
			await user.click(within(dialog).getByRole("button", { name: /hold seats/i }));

			expect(await within(dialog).findByRole("alert")).toHaveTextContent(/couldn't reach travelomo/i);
			expect(within(dialog).getByRole("button", { name: /hold seats/i })).toBeEnabled();
		});

		it("sends one reservation for a double click", async () => {
			signInAs();
			const reply = deferredReply([201, makeBooking()]);
			const api = mockApi({
				[`GET ${EVENT_PATH}`]: [200, { id: "e-1", available_seats: 5 }],
				"POST /bookings/": reply.route,
			});
			const { user } = renderSidebar();

			const dialog = await openDialog(user);
			await user.dblClick(within(dialog).getByRole("button", { name: /hold seats/i }));
			expect(within(dialog).getByRole("button", { name: /holding seats/i })).toBeDisabled();
			reply.release();

			expect(await screen.findByText("Complete your booking")).toBeInTheDocument();
			expect(api.count("POST", "/bookings/")).toBe(1);
		});
	});

	describe("after reserving", () => {
		function mockReservationApi() {
			return mockApi({
				[`GET ${EVENT_PATH}`]: [200, { id: "e-1", available_seats: 5 }],
				"POST /bookings/": (request) => [201, makeBooking({ seat_number: (request.body as { seat_number: number }).seat_number })],
				"POST /bookings/b-1/cancel/": [200, { detail: "Booking cancelled successfully." }],
				"POST /bookings/b-1/payment-reference/": [200, pendingBooking()],
			});
		}

		it("asks for confirmation before releasing held seats", async () => {
			signInAs();
			const api = mockReservationApi();
			const { user } = renderSidebar();

			const dialog = await openDialog(user);
			await user.click(within(dialog).getByRole("button", { name: /hold seats/i }));
			await user.click(await screen.findByRole("button", { name: /cancel reservation/i }));

			expect(screen.getByText("Cancel this reservation?")).toBeInTheDocument();
			expect(api.count("POST", "/bookings/b-1/cancel/")).toBe(0);

			await user.click(screen.getByRole("button", { name: /keep booking/i }));
			expect(screen.getByText("Complete your booking")).toBeInTheDocument();

			await user.click(screen.getByRole("button", { name: /cancel reservation/i }));
			await user.click(screen.getByRole("button", { name: /yes, cancel/i }));

			await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
			expect(api.count("POST", "/bookings/b-1/cancel/")).toBe(1);
			expect(toastMock.success).toHaveBeenCalledWith("Booking cancelled and seats released");
			expect(routerMock.refresh).toHaveBeenCalled();
		});

		it("submits the transaction ID and shows the verification state", async () => {
			signInAs();
			const api = mockReservationApi();
			const { user } = renderSidebar();

			const dialog = await openDialog(user);
			await user.click(within(dialog).getByRole("button", { name: /hold seats/i }));
			await user.type(await screen.findByLabelText(/transaction id/i), "TRX-9001");
			await user.click(screen.getByRole("button", { name: /submit for verification/i }));

			expect(await screen.findByText("Sent for verification")).toBeInTheDocument();
			expect(api.requests.find((r) => r.path === "/bookings/b-1/payment-reference/")?.body).toEqual({
				payment_method: "pm-1",
				transaction_id: "TRX-9001",
			});
		});

		it("returns to seat selection when the hold has expired on the server", async () => {
			signInAs();
			mockApi({
				[`GET ${EVENT_PATH}`]: [200, { id: "e-1", available_seats: 5 }],
				"POST /bookings/": [201, makeBooking()],
				"POST /bookings/b-1/payment-reference/": [
					409,
					{ detail: "Your seat hold expired before the transaction ID was submitted.", code: "booking_expired" },
				],
			});
			const { user } = renderSidebar();

			const dialog = await openDialog(user);
			await user.click(within(dialog).getByRole("button", { name: /hold seats/i }));
			await user.type(await screen.findByLabelText(/transaction id/i), "TRX-LATE");
			await user.click(screen.getByRole("button", { name: /submit for verification/i }));

			expect(await screen.findByText(/seat hold expired before/i)).toBeInTheDocument();
			await user.click(screen.getByRole("button", { name: /start over/i }));

			expect(screen.getByText("Reserve your seats")).toBeInTheDocument();
			expect(screen.getByText(/previous seat hold expired/i)).toBeInTheDocument();
		});
	});
});
