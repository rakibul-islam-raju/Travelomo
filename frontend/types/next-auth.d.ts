// types/next-auth.d.ts
import "next-auth";

// Extend the User type
declare module "next-auth" {
	interface User {
		id: string;
		email: string;
		first_name: string;
		last_name: string;
		is_active: boolean;
		role: "customer" | "vendor" | "admin";
		access: string;
		refresh: string;
		exp: number;
	}

	interface Session {
		user: User & {
			error?: string;
		};
	}
}

// Extend JWT type
declare module "next-auth/jwt" {
	interface JWT {
		access: string;
		refresh: string;
		exp: number;
		error?: string;
		role: "customer" | "vendor" | "admin";
		user: User;
	}
}
