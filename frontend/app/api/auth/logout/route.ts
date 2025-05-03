import { COOKIE_CONSTS } from "@/config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const response = NextResponse.json({ detail: "Logged out successfully" });

	// Clear all auth cookies
	response.cookies.delete(COOKIE_CONSTS.ACCESS_TOKEN);
	response.cookies.delete(COOKIE_CONSTS.REFRESH_TOKEN);
	response.cookies.delete(COOKIE_CONSTS.IS_LOGGED_IN);

	return response;
}
