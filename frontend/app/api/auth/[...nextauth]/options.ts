import { BASE_API_URL } from "@/config";
import { jwtDecode } from "jwt-decode";
import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Types for decoded token payload
interface UserInfo {
	email: string;
	first_name: string;
	last_name: string;
	is_active: boolean;
	role: string;
}

interface DecodedToken {
	exp: number;
	iat: number;
	jti: string;
	user_id: string;
	user: UserInfo;
}

export const authOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: {
					label: "Email",
					type: "email",
					placeholder: "john@mail.com",
				},
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials: any, req) {
				if (!credentials?.email || !credentials?.password) return null;
				const { email, password } = credentials;
				const response = await fetch(BASE_API_URL + "/auth/login", {
					method: "POST",
					body: JSON.stringify({
						email,
						password,
					}),
					headers: {
						"Content-Type": "application/json",
					},
				});
				if (!response.ok) {
					return null;
				}

				const { access, refresh } = await response.json();
				const decodedToken = jwtDecode<DecodedToken>(access);
				const user = {
					...decodedToken?.user,
					access,
					refresh,
					exp: decodedToken.exp,
				} as User;

				return user;
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.refresh = user.refresh;
				token.access = user.access;
				token.email = user.email;
				token.name = user.first_name + " " + user.last_name;
				token.exp = user.exp;
				token.role = user.role;
				token.user = user;
			}
			return token;
		},

		async session({ session, token }) {
			if (session) {
				session.user = token.user;
			}
			return session;
		},
	},
	pages: {
		signIn: "/login",
	},
	session: {
		strategy: "jwt",
	},
	secret: process.env.NEXTAUTH_SECRET,
};
