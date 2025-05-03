import { COOKIE_CONSTS } from "@/config";
import ApiProxy from "@/lib/ApiProxy";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { email, password } = await request.json();

		const response = await ApiProxy.post(`/auth/login/`, { email, password });

		console.log("login response ->", response);

		if (response.data.access) {
			request.cookies.set(COOKIE_CONSTS.ACCESS_TOKEN, response.data.access);
			request.cookies.set(COOKIE_CONSTS.REFRESH_TOKEN, response.data.refresh);
		}

		return NextResponse.json({
			status: response.status,
			data: response.data,
		});
	} catch (error: any) {
		console.error("Login error:", error);

		// Get status code and error data from ApiProxy's error format
		const status = error.response?.status || 500;

		return NextResponse.json(
			{
				status,
				error: error.response?.data || {
					detail: "An error occurred during login",
				},
			},
			{ status }
		);
	}
}
