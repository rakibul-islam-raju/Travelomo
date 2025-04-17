"use client";

import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useSession } from "next-auth/react";

export function StoreInfo() {
	const session = useSession();

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton
					size="lg"
					className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
						<Avatar>
							{session?.data?.user?.vendor?.logo && (
								<AvatarImage src={session?.data?.user?.vendor?.logo} />
							)}
							<AvatarFallback>
								{session?.data?.user?.vendor?.store_name.charAt(0)}
							</AvatarFallback>
						</Avatar>
					</div>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-semibold">
							{session?.data?.user?.vendor?.store_name}
						</span>
						<span className="truncate text-xs">
							{session?.data?.user?.vendor?.store_name}
						</span>
					</div>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
