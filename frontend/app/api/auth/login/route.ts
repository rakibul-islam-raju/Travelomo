import { COOKIE_CONSTS } from "@/config";
import ApiProxy from "@/lib/ApiProxy";
import { handleApiError } from "@/lib/apiErrorHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { email, password } = await request.json();

		const response = await ApiProxy.post(`/auth/login/`, { email, password });

		if (response.data.access) {
			const responseObj = NextResponse.json({
				status: response.status,
				data: response.data,
			});

			// Set HttpOnly cookies for tokens (secure)
			responseObj.cookies.set({
				name: COOKIE_CONSTS.ACCESS_TOKEN,
				value: response.data.access,
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 60 * 60 * 24 * 1, // 1 day
			});

			responseObj.cookies.set({
				name: COOKIE_CONSTS.REFRESH_TOKEN,
				value: response.data.refresh,
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 60 * 60 * 24 * 7, // 7 days
			});

			// Set a non-HttpOnly cookie with just the auth status
			responseObj.cookies.set({
				name: COOKIE_CONSTS.IS_LOGGED_IN,
				value: "true",
				httpOnly: false, // Accessible to JavaScript
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 60 * 60 * 24 * 1, // 1 day
			});

			return responseObj;
		}

		return NextResponse.json({
			status: response.status,
			data: response.data,
		});
	} catch (error: any) {
		return handleApiError(error, "An error occurred during login");
	}
}
