import ApiProxy from "@/lib/ApiProxy";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const data = await request.json();

		let response;
		if (data?.store_name) {
			console.log("vendor registration ->", data);
			response = await ApiProxy.post(`/auth/register/vendor/`, data);
		} else {
			console.log("customer registration ->", data);
			response = await ApiProxy.post(`/auth/register/customer/`, data);
		}

		console.log("registration response ->", response);

		return NextResponse.json({
			status: response.status,
			data: response.data,
		});
	} catch (error: any) {
		console.error("Registration error:", error);

		// Get status code and error data from ApiProxy's error format
		const status = error.response?.status || 500;

		return NextResponse.json(
			{
				status,
				error: error.response?.data || {
					detail: "An error occurred during registration",
				},
			},
			{ status }
		);
	}
}
