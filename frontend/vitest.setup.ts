import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useAuthStore } from "./stores/authStore";

vi.mock("next/navigation", async () => {
	const { routerMock, navigationState } = await import("./__tests__/mocks");
	return {
		useRouter: () => routerMock,
		usePathname: () => navigationState.pathname,
		useSearchParams: () => new URLSearchParams(navigationState.search),
	};
});

vi.mock("sonner", async () => {
	const { toastMock } = await import("./__tests__/mocks");
	return { toast: toastMock, Toaster: () => null };
});

// jsdom lacks these browser APIs, which Radix primitives call.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
	vi.unstubAllGlobals();
	useAuthStore.setState({ isAuthenticated: false, user: undefined });
});
