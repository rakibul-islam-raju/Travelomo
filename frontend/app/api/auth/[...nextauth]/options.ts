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
	role: "customer" | "vendor" | "admin";
}

interface DecodedToken {
	exp: number;
	iat: number;
	jti: string;
	user_id: string;
	user: UserInfo;
}

// Extend the token type to include our custom properties
interface ExtendedToken {
	sub?: string;
	tokens?: { access: string; refresh: string };
	email?: string;
	name?: string;
	exp?: number;
	user?: any;
	role?: "customer" | "vendor" | "admin";
	user_id?: string;
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
				try {
					if (!credentials?.email || !credentials?.password) {
						throw new Error("Email and password are required");
					}

					const { email, password } = credentials;

					const response = await fetch(BASE_API_URL + "/auth/login/", {
						method: "POST",
						body: JSON.stringify({
							email,
							password,
						}),
						headers: {
							"Content-Type": "application/json",
						},
					});

					const data = await response.json();

					if (response.status === 401) {
						throw new Error(data?.detail || "Invalid email or password");
					}

					const { access, refresh } = data;

					const decodedToken: DecodedToken = jwtDecode(access);

					if (decodedToken.user.role === "admin") {
						throw new Error("Admin login not allowed");
					}

					const user: User = {
						id: decodedToken.jti,
						name: `${decodedToken.user.first_name} ${decodedToken.user.last_name}`,
						user_id: decodedToken.user_id,
						first_name: decodedToken.user.first_name,
						last_name: decodedToken.user.last_name,
						email: decodedToken.user.email,
						role: decodedToken.user.role,
						is_active: decodedToken.user.is_active,
						tokens: { access, refresh },
						exp: decodedToken.exp * 1000,
					};

					return user;
				} catch (err: any) {
					throw new Error(err.message || "Authentication failed");
				}
			},
		}),
	],
	callbacks: {
		async redirect({ url, baseUrl }) {
			return url.startsWith(baseUrl)
				? Promise.resolve(url)
				: Promise.resolve(baseUrl);
		},

		async jwt({ token, user, account }) {
			if (user && account) {
				token.sub = user.id;
				token.tokens = user.tokens;
				token.email = user.email;
				token.name = user.name;
				token.exp = user.exp;
				token.user = user;
				token.role = user.role;
				token.user_id = user.user_id;

				return token;
			}

			// Token expiration check
			if (Date.now() < token.exp) {
				return token;
			}

			return token;
		},

		async session({ session, token }) {
			if (session) {
				const extendedToken = token as ExtendedToken;
				session.user = token.user;
				session.expires = new Date(token.exp).toISOString();

				if (extendedToken.role) {
					session.user.role = extendedToken.role;
				}

				if (extendedToken.user_id) {
					session.user.user_id = extendedToken.user_id;
				}
			}
			return session;
		},
	},
	pages: {
		signIn: "/login",
		error: "/login",
	},
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	secret: process.env.NEXTAUTH_SECRET,
};
