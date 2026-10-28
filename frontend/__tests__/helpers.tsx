import { useAuthStore } from "@/stores/authStore";
import { IBooking, IPaymentMethod } from "@/types/booking.types";
import { User, UserRole } from "@/types/user.types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement } from "react";
import { vi } from "vitest";

type ApiRequest = { method: string; path: string; query: URLSearchParams; body: unknown };
type ApiReply = Response | [status: number, body?: unknown] | "network-error";
type ApiRoute = ApiReply | ((request: ApiRequest) => ApiReply | Promise<ApiReply>);

export const jsonResponse = (status: number, body?: unknown) =>
	status === 204
		? new Response(null, { status })
		: new Response(JSON.stringify(body ?? {}), {
				status,
				headers: { "Content-Type": "application/json" },
			});

/**
 * Replaces `fetch` with a fake API keyed by "METHOD /path/" (without the
 * `/api/v1` prefix). Unmatched requests fail the test via `unhandled`.
 */
export function mockApi(routes: Record<string, ApiRoute>) {
	const requests: ApiRequest[] = [];
	const unhandled: string[] = [];

	const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = new URL(String(input));
		const method = init?.method ?? "GET";
		const request: ApiRequest = {
			method,
			path: url.pathname.replace(/^\/api\/v1/, ""),
			query: url.searchParams,
			body: init?.body ? JSON.parse(String(init.body)) : undefined,
		};
		requests.push(request);

		const route = routes[`${method} ${request.path}`];
		if (route === undefined) {
			unhandled.push(`${method} ${request.path}`);
			return jsonResponse(500, { detail: `Unhandled ${method} ${request.path}` });
		}
		const reply = typeof route === "function" ? await route(request) : route;
		if (reply === "network-error") throw new TypeError("Failed to fetch");
		return Array.isArray(reply) ? jsonResponse(reply[0], reply[1]) : reply;
	});
	vi.stubGlobal("fetch", fetchMock);

	return {
		requests,
		unhandled,
		count: (method: string, path: string) =>
			requests.filter((r) => r.method === method && r.path === path).length,
	};
}

/** A reply held open until `release()`, to act while a request is in flight. */
export function deferredReply(reply: ApiReply) {
	let release!: () => void;
	const promise = new Promise<ApiReply>((resolve) => {
		release = () => resolve(reply);
	});
	return { route: () => promise, release };
}

export function renderWithClient(ui: ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	// Radix sets `pointer-events: none` on <body> while a modal is open.
	const user = userEvent.setup({ pointerEventsCheck: 0 });
	return {
		user,
		queryClient,
		...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
	};
}

export function signInAs(role: UserRole = UserRole.CUSTOMER) {
	const user: User = {
		id: `${role}-1`,
		email: `${role}@example.com`,
		first_name: "Test",
		last_name: role,
		full_name: `Test ${role}`,
		role,
		is_active: true,
		is_staff: role === UserRole.ADMIN,
		is_superuser: false,
		avatar: null,
	};
	useAuthStore.setState({ isAuthenticated: true, user });
	return user;
}

export const paymentMethod: IPaymentMethod = {
	id: "pm-1",
	channel: "bkash",
	channel_label: "bKash",
	name: "bKash",
	account_name: "Friendly Tours",
	account_number: "01700000000",
	instructions: "Use Send Money.",
	is_active: true,
	created_at: "2026-10-01T00:00:00Z",
	updated_at: "2026-10-01T00:00:00Z",
};

export function makeBooking(overrides: Partial<IBooking> = {}): IBooking {
	return {
		id: "b-1",
		event: "e-1",
		booking_reference: "TL-ABC123",
		seat_number: 2,
		status: "awaiting_payment_reference",
		status_label: "Awaiting payment reference",
		total_price: "2400.00",
		currency: "BDT",
		can_cancel: true,
		payment_reference_expires_at: new Date(Date.now() + 20 * 60_000).toISOString(),
		verification_expires_at: null,
		cancelled_at: null,
		event_title: "Sundarbans Weekend",
		event_slug: "sundarbans-weekend",
		event_start_date: "2026-12-01",
		event_end_date: "2026-12-03",
		event_location: "Khulna",
		event_image: null,
		event_price: "1200.00",
		payment_submission: null,
		payment_methods: [paymentMethod],
		created_at: "2026-10-28T10:00:00Z",
		...overrides,
	};
}

export function pendingBooking(overrides: Partial<IBooking> = {}): IBooking {
	return makeBooking({
		status: "pending_verification",
		status_label: "Pending verification",
		payment_methods: [],
		payment_submission: {
			id: "sub-1",
			payment_method: paymentMethod.id,
			payment_method_name: paymentMethod.name,
			channel: "bkash",
			channel_label: "bKash",
			amount: "1200.00",
			currency: "BDT",
			transaction_id: "TRX-9001",
			status: "pending",
			reviewed_by_name: null,
			reviewed_at: null,
			rejection_reason: "",
			created_at: "2026-10-28T10:05:00Z",
		},
		...overrides,
	});
}

export const listPage = <T,>(results: T[], { count = results.length, next = null as string | null } = {}) => ({
	count,
	next,
	previous: null,
	results,
});
