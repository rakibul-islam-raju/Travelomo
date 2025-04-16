import { siteConfig } from "@/config/siteConfig";

import type { Metadata } from "next";

import { Toaster } from "@/components/ui/toaster";
import AppProvider from "@/context/AppProvider";
import { getServerSession } from "next-auth";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
	subsets: ["latin"],
	variable: "--font-poppins",
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
	title: "Travel More",
	description: siteConfig.description,
};

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Get server-side session
	const session = await getServerSession();

	return (
		<html lang="en">
			<body className={`${poppins.variable} antialiased`}>
				<Toaster />
				<AppProvider session={session}>{children}</AppProvider>
			</body>
		</html>
	);
}
