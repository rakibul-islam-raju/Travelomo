import { Toaster } from "@/components/ui/sonner";
import { ReduxProvider } from "@/context/ReduxProvider";
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
				<ReduxProvider>
					<Toaster richColors closeButton theme="light" />
					{children}
				</ReduxProvider>
			</AuthInitializer>
		</QueryProvider>
	);
}
