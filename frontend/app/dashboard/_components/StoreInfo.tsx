"use client";

import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useVendorStore } from "@/stores/vendorStore";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

export function StoreInfo() {
	const vendor = useVendorStore((state) => state.vendor);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton
					size="lg"
					className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
						<Avatar>
							{vendor?.logo && <AvatarImage src={vendor?.logo} />}
							<AvatarFallback>{vendor?.store_name.charAt(0)}</AvatarFallback>
						</Avatar>
					</div>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-semibold">{vendor?.store_name}</span>
						<span className="truncate text-xs">{vendor?.store_name}</span>
					</div>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
