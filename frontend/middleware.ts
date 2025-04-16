// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
export { default } from "next-auth/middleware";

const publicRoutes = [
	"/login",
	"/registration",
	"/vendor-registration",
	"/activate-account",
	"/forget-password",
];

export const config = {
	matcher: [
		"/",
		"/dashboard(.*)",
		"/login",
		"/registration",
		"/vendor-registration",
		"/activate-account",
		"/forget-password",
	],
};

export async function middleware(request: NextRequest) {
	// Get the token with proper configuration
	const token = await getToken({
		req: request,
		secret: process.env.NEXTAUTH_SECRET,
	});

	const url = request.nextUrl;

	// Check if user is not logged in and trying to access protected routes
	if (!token && url.pathname.startsWith("/dashboard")) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// Check if user is logged in but not a vendor and trying to access vendor dashboard
	if (
		token &&
		token.user &&
		token.user.role !== "vendor" &&
		url.pathname.startsWith("/dashboard")
	) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	// Check if user is logged in and trying to access auth pages
	if (token && publicRoutes.includes(url.pathname)) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}
