import ApiProxy from "@/lib/ApiProxy";
import { handleApiError } from "@/lib/apiErrorHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const data = await request.json();

		let response;
		if (data?.store_name) {
			response = await ApiProxy.post(`/auth/register/vendor/`, data);
		} else {
			response = await ApiProxy.post(`/auth/register/customer/`, data);
		}

		return NextResponse.json(response);
	} catch (error: any) {
		return handleApiError(error, "An error occurred during registration");
	}
}
