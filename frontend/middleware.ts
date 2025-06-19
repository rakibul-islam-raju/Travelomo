import { NextRequest, NextResponse } from "next/server";
import { COOKIE_CONSTS } from "./constants";

// Define protected routes that require authentication
const protectedRoutes = ["/dashboard"];

const protectedRoutesInclude = ["/checkout"];

// Define authentication routes (routes that logged-in users shouldn't access)
const authRoutes = [
	"/login",
	"/registration",
	"/vendor-registration",
	"/forgot-password",
	"/reset-password",
	"/activate-account",
];

// Define vendor routes
const vendorRoutes = ["/vendor-onboarding", "/dashboard"];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if user is logged in by looking for the is_logged_in cookie
	const isLoggedIn = request.cookies.has(COOKIE_CONSTS.IS_LOGGED_IN);
	const role = request.cookies.get(COOKIE_CONSTS.ROLE)?.value;
	const isVendor = role === "vendor";
	const isCustomer = role === "customer";

	// If the user is trying to access an auth route (like login) while already logged in,
	// redirect them to the homepage or dashboard based on the role
	if (isLoggedIn && authRoutes.some((route) => pathname.startsWith(route))) {
		return NextResponse.redirect(
			new URL(isVendor ? "/dashboard" : "/", request.url)
		);
	}

	console.log("is logged in ==>>", isLoggedIn);
	console.log("isVendor ==>>", isVendor);

	// If the user is not logged in and tries to access a protected route,
	// redirect them to the login page with callback url
	if (
		!isLoggedIn &&
		(protectedRoutes.some((route) => pathname.startsWith(route)) ||
			protectedRoutesInclude.some((route) => pathname.includes(route)))
	) {
		console.log("redirecting to login page ===>");
		return NextResponse.redirect(
			new URL(`/login?callbackUrl=${pathname}`, request.url)
		);
	}

	// If logged in user is customer and tries to access dashboard routes
	// redirect to the home page
	if (
		isLoggedIn &&
		!isVendor &&
		vendorRoutes.some((route) => pathname.startsWith(route))
	) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	// If the user is logged in and user type is vendor and onboarding is completed, but tries to access the customer pages
	// redirect to the dashboard
	if (
		isLoggedIn &&
		role === "vendor" &&
		!vendorRoutes.some((route) => pathname.startsWith(route))
	) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
	matcher: [
		/*
		 * Match all routes except for:
		 * 1. /api routes (all API routes)
		 * 2. /_next (Next.js internal routes)
		 * 3. /_static (static files)
		 * 4. /_vercel (Vercel system files)
		 * 5. /favicon.ico, /sitemap.xml, /robots.txt (SEO files)
		 */
		"/((?!api|_next|_static|_vercel|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};
