"use client";

import { logoutAction } from "@/actions/authActions";
import { COOKIE_CONSTS } from "@/config";
import { internalApi } from "@/lib/axiosInstance";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

/**
 * Auth initializer component that checks logged in status from cookies
 * and fetches user data if needed to update the global state
 */
export default function AuthInitializer({
	children,
}: {
	children: React.ReactNode;
}) {
	const { setUser, clearUser } = useAuthStore();
	const [isInitialized, setIsInitialized] = useState(false);

	const isLoggedIn = Cookies.get(COOKIE_CONSTS.IS_LOGGED_IN);

	const {
		data: user,
		isError,
		isSuccess,
	} = useQuery({
		queryKey: ["me"],
		queryFn: () => internalApi.get("/auth/me"),
		enabled: !!isLoggedIn,
		retry: false,
	});

	useEffect(() => {
		if (isSuccess && user) {
			setUser(user.data);
			setIsInitialized(true);
		}
	}, [user, isSuccess]);

	useEffect(() => {
		const logout = async () => {
			await logoutAction();
		};

		if (isError) {
			clearUser();
			setIsInitialized(true);
			clearUser();
			// logout
			logout();
		}
	}, [isError]);

	const content = isInitialized ? children : "Loading...";

	return content;
}
