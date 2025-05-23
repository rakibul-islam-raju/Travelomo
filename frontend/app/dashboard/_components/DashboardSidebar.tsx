"use client";

import { LayoutDashboard, Settings2, SquareTerminal } from "lucide-react";
import * as React from "react";

import { NavMain } from "@/app/dashboard/_components/nav-main";
import { NavUser } from "@/app/dashboard/_components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { StoreInfo } from "./StoreInfo";

// This is sample data.
const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},

	navMain: [
		{
			title: "Dashboard",
			url: "/dashboard",
			icon: LayoutDashboard,
		},
		{
			title: "Events",
			url: "/dashboard/events",
			icon: SquareTerminal,
		},
		{
			title: "Settings",
			url: "#",
			icon: Settings2,
			items: [
				{
					title: "General",
					url: "#",
				},
				{
					title: "Team",
					url: "#",
				},
				{
					title: "Billing",
					url: "#",
				},
				{
					title: "Limits",
					url: "#",
				},
			],
		},
	],

	// projects: [
	// 	{
	// 		name: "Design Engineering",
	// 		url: "#",
	// 		icon: Frame,
	// 	}
	// ],
};

export function DashboardSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<StoreInfo />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				{/* <NavProjects projects={data.projects} /> */}
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
