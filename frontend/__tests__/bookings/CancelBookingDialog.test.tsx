import { CancelBookingDialog } from "@/components/bookings/CancelBookingDialog";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	deferredReply,
	makeBooking,
	mockApi,
	pendingBooking,
	renderWithClient,
} from "../helpers";
import { routerMock, toastMock } from "../mocks";

const CANCEL_PATH = "/bookings/b-1/cancel/";

function renderDialog(booking = pendingBooking()) {
	const onClose = vi.fn();
	const view = renderWithClient(<CancelBookingDialog booking={booking} onClose={onClose} />);
	return { ...view, onClose };
}

describe("CancelBookingDialog", () => {
	it("stays closed without a booking", () => {
		renderWithClient(<CancelBookingDialog booking={null} onClose={vi.fn()} />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("explains the consequences for each booking state", () => {
		const { unmount } = renderDialog(makeBooking({ status: "confirmed" }));
		expect(screen.getByText("Cancel this confirmed booking?")).toBeInTheDocument();
		expect(screen.getByText(/refund is arranged directly with the organizer/i)).toBeInTheDocument();
		unmount();

		renderDialog(pendingBooking());
		expect(screen.getByText(/transaction id will be withdrawn/i)).toBeInTheDocument();
	});

	it("does nothing until the customer confirms", async () => {
		const api = mockApi({});
		const { user, onClose } = renderDialog();

		await user.click(screen.getByRole("button", { name: /keep booking/i }));

		expect(onClose).toHaveBeenCalled();
		expect(api.requests).toHaveLength(0);
	});

	it("cancels once, refreshes booking data and closes", async () => {
		const reply = deferredReply([200, { detail: "Booking cancelled successfully." }]);
		const api = mockApi({ [`POST ${CANCEL_PATH}`]: reply.route });
		const { user, onClose, queryClient } = renderDialog();
		const invalidate = vi.spyOn(queryClient, "invalidateQueries");

		await user.dblClick(screen.getByRole("button", { name: /yes, cancel/i }));
		expect(screen.getByRole("button", { name: /cancelling/i })).toBeDisabled();
		expect(screen.getByRole("button", { name: /keep booking/i })).toBeDisabled();
		reply.release();

		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(api.count("POST", CANCEL_PATH)).toBe(1);
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ["MyBookings"] });
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ["EventAvailability", "e-1"] });
		expect(routerMock.refresh).toHaveBeenCalled();
	});

	it("shows a closed deadline inline and blocks retrying", async () => {
		mockApi({
			[`POST ${CANCEL_PATH}`]: [
				400,
				{ detail: "This booking can no longer be cancelled.", code: "cancellation_closed" },
			],
		});
		const { user, onClose } = renderDialog(makeBooking({ status: "confirmed" }));

		await user.click(screen.getByRole("button", { name: /yes, cancel/i }));

		expect(await screen.findByRole("alert")).toHaveTextContent("This booking can no longer be cancelled.");
		expect(screen.getByRole("button", { name: /yes, cancel/i })).toBeDisabled();
		expect(onClose).not.toHaveBeenCalled();
		expect(toastMock.error).not.toHaveBeenCalled();
		expect(routerMock.refresh).toHaveBeenCalled();
	});

	it("treats an already-cancelled booking as done", async () => {
		mockApi({
			[`POST ${CANCEL_PATH}`]: [409, { detail: "This booking is already cancelled.", code: "already_cancelled" }],
		});
		const { user, onClose } = renderDialog();

		await user.click(screen.getByRole("button", { name: /yes, cancel/i }));

		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(toastMock.info).toHaveBeenCalledWith("This booking was already cancelled.");
	});

	it("lets the customer retry after a network failure", async () => {
		let attempts = 0;
		mockApi({
			[`POST ${CANCEL_PATH}`]: () =>
				++attempts === 1 ? "network-error" : [200, { detail: "Booking cancelled successfully." }],
		});
		const { user, onClose } = renderDialog();

		await user.click(screen.getByRole("button", { name: /yes, cancel/i }));
		expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't reach travelomo/i);

		await user.click(screen.getByRole("button", { name: /yes, cancel/i }));
		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(attempts).toBe(2);
	});
});
