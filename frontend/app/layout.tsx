import { siteConfig } from "@/config/siteConfig";

import type { Metadata } from "next";

import AppProvider from "@/context/AppProvider";
import AuthProvider from "@/context/AuthProvider";
import { getServerSession } from "next-auth";
import { Poppins } from "next/font/google";
import { authOptions } from "./api/auth/[...nextauth]/options";
import "./globals.css";

const poppins = Poppins({
	subsets: ["latin"],
	variable: "--font-poppins",
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
	title: siteConfig.name,
	description: siteConfig.description,
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Get server-side session with authOptions
	const session = await getServerSession(authOptions);

	return (
		<html lang="en">
			<body className={`${poppins.variable} antialiased`}>
				<AuthProvider session={session}>
					<AppProvider>{children}</AppProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
