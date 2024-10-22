import { DashboardSidebar } from "@/app/dashboard/_components/DashboardSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "./_components/DashboardHeader";

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
