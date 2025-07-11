import { Toaster } from "@/components/ui/sonner";
import AuthInitializer from "./AuthInitializer";
import QueryProvider from "./QueryProvider";

export default function AppProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<QueryProvider>
			<AuthInitializer>
				<Toaster richColors closeButton theme="light" position="top-center" />
				{children}
			</AuthInitializer>
		</QueryProvider>
	);
}
