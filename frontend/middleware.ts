// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
export { default } from "next-auth/middleware";

export const config = {
	matcher: [
		"/login",
		"/registration",
		"/vendor-registration",
		"/activate-account",
		"/forget-password",
		"/",
		"/dashboard/:path*",
	],
};

export async function middleware(request: NextRequest) {
	const token = await getToken({ req: request });
	const url = request.nextUrl;

	if (!token && url.pathname.startsWith("/dashboard")) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	if (
		token &&
		token.role !== "vendor" &&
		url.pathname.startsWith("/dashboard")
	) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	if (
		token &&
		(url.pathname.startsWith("/login") ||
			url.pathname.startsWith("/registration") ||
			url.pathname.startsWith("/vendor-registration") ||
			url.pathname.startsWith("/activate-account") ||
			url.pathname.startsWith("/forget-password"))
	) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}
