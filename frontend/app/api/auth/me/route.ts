import { COOKIE_CONSTS } from "@/config";
import ApiProxy from "@/lib/ApiProxy";
import { handleApiError } from "@/lib/apiErrorHandler";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Get token from cookies
		const accessToken = request.cookies.get(COOKIE_CONSTS.ACCESS_TOKEN)?.value;

		if (!accessToken) {
			return NextResponse.json(
				{
					status: 401,
					error: { detail: "Not authenticated" },
				},
				{ status: 401 }
			);
		}

		// Fetch user info from backend API
		const response = await ApiProxy.get(`/auth/me/`);

		return NextResponse.json({
			status: response.status,
			data: response.data,
		});
	} catch (error: any) {
		return handleApiError(error, "Error fetching user information");
	}
}
