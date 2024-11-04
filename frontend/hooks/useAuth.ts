// hooks/useAuth.ts
import { useSession } from "next-auth/react";

export function useAuth() {
	const { data: session, status } = useSession();

	return {
		user: session?.user,
		isVendor: session?.user?.role === "vendor",
		isAuthenticated: status === "authenticated",
		isLoading: status === "loading",
		session,
	};
}
