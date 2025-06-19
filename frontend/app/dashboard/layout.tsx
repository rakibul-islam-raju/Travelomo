"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { vendorServices } from "@/services/vendorServices";
import { useVendorStore } from "@/stores/vendorStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import DashboardHeader from "./_components/DashboardHeader";
import { DashboardSidebar } from "./_components/DashboardSidebar";

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { setVendor } = useVendorStore();

	const { data: vendorData, isSuccess } = useQuery({
		queryKey: ["me-vendor"],
		queryFn: () => vendorServices.getMeVendor(),
	});

	useEffect(() => {
		if (isSuccess && vendorData) {
			setVendor(vendorData);
		}
	}, [isSuccess, vendorData, setVendor]);

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
