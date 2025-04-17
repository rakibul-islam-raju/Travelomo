// types/next-auth.d.ts
import { VendorInfo } from "@/app/api/auth/[...nextauth]/options";
import "next-auth";

// Extend the User type
declare module "next-auth" {
	interface User {
		id: string;
		user_id: string;
		email: string;
		first_name: string;
		last_name: string;
		is_active: boolean;
		role: "customer" | "vendor" | "admin";
		tokens: { access: string; refresh: string };
		exp: number;
		vendor?: VendorInfo;
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
		tokens: { access: string; refresh: string };
		exp: number;
		error?: string;
		user: User;
	}
}
