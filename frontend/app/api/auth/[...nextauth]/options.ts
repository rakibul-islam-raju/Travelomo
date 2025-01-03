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
					if (!credentials?.email || !credentials?.password) return null;

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

					if (response.status !== 200) {
						return null;
					}

					const data = await response.json();
					const { access, refresh } = data;

					const decodedToken: DecodedToken = jwtDecode(access);

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
				} catch (err) {
					console.log("err =>", err);
					return null;
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

				console.log("token ->", token);
				return token;
			}

			// Token expiration check
			if (Date.now() < user?.exp) {
				// TODO::
				console.log("Token has expired, consider refreshing");
				return token;
			}

			return token;
		},

		async session({ session, token }) {
			if (session) {
				session.user = token.user;
				session.expires = new Date(token.exp).toISOString();
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
