import { PaymentReferenceForm } from "@/components/bookings/PaymentReferenceForm";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	deferredReply,
	makeBooking,
	mockApi,
	pendingBooking,
	renderWithClient,
} from "../helpers";
import { toastMock } from "../mocks";

const SUBMIT_PATH = "/bookings/b-1/payment-reference/";

function renderForm(booking = makeBooking()) {
	const handlers = { onSubmitted: vi.fn(), onCancel: vi.fn(), onExpired: vi.fn() };
	const view = renderWithClient(<PaymentReferenceForm booking={booking} {...handlers} />);
	return { ...view, ...handlers };
}

describe("PaymentReferenceForm", () => {
	it("submits the transaction ID once", async () => {
		const reply = deferredReply([200, pendingBooking()]);
		const api = mockApi({ [`POST ${SUBMIT_PATH}`]: reply.route });
		const { user, onSubmitted } = renderForm();

		await user.type(screen.getByLabelText(/transaction id/i), " TRX-9001 ");
		await user.dblClick(screen.getByRole("button", { name: /submit for verification/i }));
		expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
		reply.release();

		await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
		expect(api.count("POST", SUBMIT_PATH)).toBe(1);
		expect(api.requests[0].body).toEqual({ payment_method: "pm-1", transaction_id: "TRX-9001" });
		expect(onSubmitted).toHaveBeenCalledWith(expect.objectContaining({ status: "pending_verification" }));
	});

	it("shows a duplicate transaction ID under the field and clears it on edit", async () => {
		mockApi({
			[`POST ${SUBMIT_PATH}`]: [400, { transaction_id: ["This transaction ID has already been submitted."] }],
		});
		const { user } = renderForm();
		const input = screen.getByLabelText(/transaction id/i);

		await user.type(input, "DUP-777");
		await user.click(screen.getByRole("button", { name: /submit for verification/i }));

		expect(await screen.findByText("This transaction ID has already been submitted.")).toBeInTheDocument();
		expect(input).toHaveAttribute("aria-invalid", "true");
		expect(toastMock.error).not.toHaveBeenCalled();

		await user.type(input, "8");
		expect(screen.queryByText("This transaction ID has already been submitted.")).not.toBeInTheDocument();
	});

	it("offers to start over when the server says the hold expired", async () => {
		mockApi({
			[`POST ${SUBMIT_PATH}`]: [409, { detail: "Your seat hold expired.", code: "booking_expired" }],
		});
		const { user, onExpired } = renderForm();

		await user.type(screen.getByLabelText(/transaction id/i), "TRX-LATE");
		await user.click(screen.getByRole("button", { name: /submit for verification/i }));

		expect(await screen.findByText("Your seat hold expired.")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /submit for verification/i })).toBeDisabled();
		expect(screen.queryByRole("button", { name: /cancel reservation/i })).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /start over/i }));
		expect(onExpired).toHaveBeenCalled();
	});

	it("disables submission once the countdown has run out", () => {
		renderForm(makeBooking({ payment_reference_expires_at: new Date(Date.now() - 1000).toISOString() }));

		expect(screen.getByText(/this seat hold has expired/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/transaction id/i)).toBeDisabled();
		expect(screen.getByRole("button", { name: /submit for verification/i })).toBeDisabled();
		expect(screen.getByRole("button", { name: /start over/i })).toBeInTheDocument();
	});

	it("routes the cancel button to the parent's confirmation step", async () => {
		const api = mockApi({});
		const { user, onCancel } = renderForm();

		await user.click(screen.getByRole("button", { name: /cancel reservation/i }));

		expect(onCancel).toHaveBeenCalled();
		expect(api.requests).toHaveLength(0);
	});
});
