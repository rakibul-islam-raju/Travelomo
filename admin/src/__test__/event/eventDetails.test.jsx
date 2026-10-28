import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import store from "@redux/store";
import { baseApi } from "@redux/baseApi";
import { axiosInstance } from "@utils/axios/axiosInstance";
import EventDetails from "@pages/event/eventDetails";

vi.mock("@utils/axios/axiosInstance", () => ({ axiosInstance: vi.fn() }));

Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

const statusRow = (status, label, bookings = 0, seats = 0, amount = "0.00") => ({
	status,
	label,
	bookings,
	seats,
	amount,
});

const event = {
	id: "evt-1",
	title: "Sundarbans Weekend",
	location: "Khulna",
	start_date: "2026-12-01",
	end_date: "2026-12-03",
	total_seats: 10,
	available_seats: 7,
	seat_booked: 3,
	actual_price: 1500,
	discount_price: 1200,
	price: 1200,
	image: null,
	tags: "forest, boat",
	status: "published",
	is_featured: false,
	is_archived: true,
	cancellation_days: 2,
	created_at: "2026-10-01T10:00:00Z",
	updated_at: "2026-10-02T10:00:00Z",
	vendor: {
		id: "vendor-1",
		store_name: "Friendly Tours",
		logo: null,
		store_email: null,
		store_phone: "+8801700000000",
		owner_email: "owner@example.com",
		is_approved: true,
	},
	booking_summary: {
		total_bookings: 2,
		verified_booking_value: "2400.00",
		currency: "BDT",
		statuses: [
			statusRow("awaiting_payment_reference", "Awaiting payment reference"),
			statusRow("pending_verification", "Pending verification", 1, 1, "1200.00"),
			statusRow("confirmed", "Confirmed", 1, 2, "2400.00"),
			statusRow("payment_rejected", "Payment rejected"),
			statusRow("expired", "Expired"),
			statusRow("cancelled", "Cancelled"),
		],
	},
};

const renderAt = (eventId) =>
	render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[`/events/${eventId}`]}>
				<Routes>
					<Route path="/events/:eventId" element={<EventDetails />} />
				</Routes>
			</MemoryRouter>
		</Provider>
	);

describe("EventDetails", () => {
	afterEach(() => {
		store.dispatch(baseApi.util.resetApiState());
		axiosInstance.mockReset();
	});

	it("requests the admin event endpoint, not the vendor one", async () => {
		axiosInstance.mockResolvedValue({ data: event });
		renderAt("evt-1");

		await screen.findByRole("heading", { level: 2, name: event.title });
		expect(axiosInstance).toHaveBeenCalledTimes(1);
		const { url, method } = axiosInstance.mock.calls[0][0];
		expect(method).toBe("GET");
		expect(url).toMatch(/\/events\/admin-event\/evt-1\/$/);
		expect(url).not.toMatch(/vendors/);
	});

	it("shows event, vendor, price, capacity, status and booking summary", async () => {
		axiosInstance.mockResolvedValue({ data: event });
		renderAt("evt-1");

		await screen.findByRole("heading", { level: 2, name: event.title });

		// status and archive state
		expect(screen.getByText("Published")).toBeInTheDocument();
		expect(screen.getByText("Archived")).toBeInTheDocument();
		// event and dates
		expect(screen.getByText("Khulna")).toBeInTheDocument();
		expect(screen.getByText("01 Dec, 2026")).toBeInTheDocument();
		expect(screen.getByText("03 Dec, 2026")).toBeInTheDocument();
		expect(screen.getByText("Up to 2 day(s) before start")).toBeInTheDocument();
		// vendor
		expect(screen.getByRole("link", { name: "Friendly Tours" })).toHaveAttribute(
			"href",
			"/vendors/vendor-1"
		);
		expect(screen.getByText("owner@example.com")).toBeInTheDocument();
		expect(screen.getByText("Approved")).toBeInTheDocument();
		// price and capacity
		expect(screen.getByText("BDT 1,500")).toBeInTheDocument();
		expect(screen.getByText("10")).toBeInTheDocument();
		expect(screen.getByText("7")).toBeInTheDocument();
		// booking summary
		expect(screen.getByText("Verified Booking Value")).toBeInTheDocument();
		expect(screen.getAllByText("BDT 2,400").length).toBeGreaterThanOrEqual(2);
		for (const row of event.booking_summary.statuses) {
			expect(screen.getByRole("cell", { name: row.label })).toBeInTheDocument();
		}
	});

	it("shows not found for an unknown event", async () => {
		axiosInstance.mockRejectedValue({
			response: { status: 404, data: { detail: "No Event matches the given query." } },
		});
		renderAt("missing");

		expect(await screen.findByText("Event not found")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
	});

	it("offers a retry when loading fails", async () => {
		axiosInstance.mockRejectedValue({
			response: { status: 500, data: { detail: "Something went wrong." } },
		});
		renderAt("evt-1");

		expect(await screen.findByText("Could not load this event")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
	});
});
