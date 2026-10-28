import { vi } from "vitest";

// Shared by the module mocks in vitest.setup.ts and by the tests that assert on them.

export const routerMock = {
	push: vi.fn(),
	replace: vi.fn(),
	refresh: vi.fn(),
	back: vi.fn(),
	forward: vi.fn(),
	prefetch: vi.fn(),
};

export const navigationState = { pathname: "/", search: "" };

export const toastMock = Object.assign(vi.fn(), {
	success: vi.fn(),
	error: vi.fn(),
	info: vi.fn(),
	warning: vi.fn(),
});
