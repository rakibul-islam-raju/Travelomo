import { Toaster } from "@/components/ui/sonner";
import { ReduxProvider } from "@/context/ReduxProvider";
import QueryProvider from "./QueryProvider";

export default function AppProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<QueryProvider>
			<ReduxProvider>
				{children}
				<Toaster richColors closeButton theme="light" />
			</ReduxProvider>
		</QueryProvider>
	);
}
