"use client";

import { Toaster } from "@/components/ui/toaster";
import { ReduxProvider } from "@/context/ReduxProvider";

export default function AppProvider({
	children,
	session,
}: {
	children: React.ReactNode;
	session: any;
}) {
	return (
		<ReduxProvider>
			{children}
			<Toaster />
		</ReduxProvider>
	);
}
