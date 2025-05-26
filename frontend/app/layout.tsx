import { siteConfig } from "@/config/siteConfig";

import type { Metadata } from "next";

import AppProvider from "@/context/AppProvider";
import { Poppins } from "next/font/google";
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
	return (
		<html lang="en">
			<body className={`${poppins.variable} antialiased`}>
				<AppProvider>{children}</AppProvider>
			</body>
		</html>
	);
}
