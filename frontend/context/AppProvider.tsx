"use client";

import { Toaster } from "@/components/ui/toaster";
import AuthProvider from "@/context/AuthProvider";
import { ReduxProvider } from "@/context/ReduxProvider";
import { SessionProvider } from "next-auth/react";

export default function AppProvider({
	children,
	session,
}: {
	children: React.ReactNode;
	session: any;
}) {
	return (
		<SessionProvider session={session}>
			<ReduxProvider>
				<AuthProvider>
					{children}
					<Toaster />
				</AuthProvider>
			</ReduxProvider>
		</SessionProvider>
	);
}
