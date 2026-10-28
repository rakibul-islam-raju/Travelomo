import { PUBLIC_ONLY_ROUTES } from "@/lib/routes";

const PLACEHOLDER_ORIGIN = "http://travelomo.local";

/**
 * Returns `value` only if it is a same-site path that is safe to redirect to
 * after login; otherwise `fallback`. Rejects absolute and protocol-relative
 * URLs (`https://evil.com`, `//evil.com`, `/\evil.com`) and login-type pages,
 * which would bounce a signed-in user away.
 */
export function getSafeRedirectPath(
	value: string | null | undefined,
	fallback = "/"
): string {
	if (!value || !value.startsWith("/") || /^\/[\\/]/.test(value)) {
		return fallback;
	}

	let url: URL;
	try {
		url = new URL(value, PLACEHOLDER_ORIGIN);
	} catch {
		return fallback;
	}
	if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;
	if (PUBLIC_ONLY_ROUTES.some((route) => url.pathname.startsWith(route))) {
		return fallback;
	}

	return `${url.pathname}${url.search}${url.hash}`;
}

/** Login page URL that returns the user to `returnTo` afterwards. */
export function buildLoginUrl(returnTo: string) {
	return `/login?callbackUrl=${encodeURIComponent(getSafeRedirectPath(returnTo))}`;
}
