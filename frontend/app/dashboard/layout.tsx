import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "./_components/DashboardHeader";
import { DashboardSidebar } from "./_components/StoreInfo";

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider>
			<DashboardSidebar />
			<SidebarInset>
				<DashboardHeader />
				<main className="p-4">{children}</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
