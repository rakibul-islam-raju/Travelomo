"use client";

import { COOKIE_CONSTS } from "@/constants";
import { authServices } from "@/services/authServices";
import { useAuthStore } from "@/stores/authStore";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
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
	const isLoggedIn = Cookies.get(COOKIE_CONSTS.IS_LOGGED_IN);
	const [isRefreshing, setIsRefreshing] = useState(true);

	const { setUser, clearUser } = useAuthStore();

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await authServices.me();
				if (response) {
					setUser(response);
				}
			} catch {
				clearUser();
			} finally {
				setIsRefreshing(false);
			}
		};

		if (isLoggedIn) {
			fetchUser();
		} else {
			clearUser();
			setIsRefreshing(false);
		}
	}, [setUser, isLoggedIn, clearUser]);

	// Show loading state only during initial authentication or token refresh
	if (isRefreshing) {
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return children;
}
