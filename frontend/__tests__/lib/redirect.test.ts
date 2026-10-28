import { buildLoginUrl, getSafeRedirectPath } from "@/lib/redirect";
import { describe, expect, it } from "vitest";

describe("getSafeRedirectPath", () => {
	it("keeps same-site paths with their query and hash", () => {
		expect(getSafeRedirectPath("/events/e-1/trip?ref=home#book")).toBe(
			"/events/e-1/trip?ref=home#book"
		);
		expect(getSafeRedirectPath("/my-bookings")).toBe("/my-bookings");
	});

	it.each([
		"https://evil.example/phish",
		"//evil.example/phish",
		"/\\evil.example",
		"javascript:alert(1)",
		"events/e-1",
		"",
		null,
		undefined,
	])("falls back for unsafe value %s", (value) => {
		expect(getSafeRedirectPath(value)).toBe("/");
	});

	it("does not send a signed-in user back to an auth page", () => {
		expect(getSafeRedirectPath("/login?callbackUrl=/x")).toBe("/");
		expect(getSafeRedirectPath("/registration", "/home")).toBe("/home");
	});
});

describe("buildLoginUrl", () => {
	it("encodes the return path", () => {
		expect(buildLoginUrl("/events/e-1/trip?ref=home")).toBe(
			"/login?callbackUrl=%2Fevents%2Fe-1%2Ftrip%3Fref%3Dhome"
		);
	});

	it("drops an unsafe return path", () => {
		expect(buildLoginUrl("//evil.example")).toBe("/login?callbackUrl=%2F");
	});
});
