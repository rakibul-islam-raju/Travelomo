// hooks/useRequireAuth.ts
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./useAuth";

export function useRequireAuth(requireAdmin = false) {
	const { user, isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.push("/login");
		}

		if (!isLoading && requireAdmin && user?.role !== "admin") {
			router.push("/unauthorized");
		}
	}, [isLoading, isAuthenticated, user, requireAdmin, router]);

	return { user, isLoading };
}
