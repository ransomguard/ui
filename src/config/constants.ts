import { LayoutDashboard, ShieldAlert, ListClock, ShieldX } from "lucide-react";

import type { SidebarNavGroup } from "@/components/layout/sidebar";



export const NAV_ITEMS: SidebarNavGroup[] = [
	{
		items: [
			{
				href: "/",
				label: "dashboard",
				icon: LayoutDashboard,
			},
			{
				href: "/alerts",
				label: "alerts",
				icon: ShieldAlert,
			},
			{
				href: "/telemetry",
				label: "telemetry",
				icon: ListClock,
			},
			{
				href: "/access-control",
				label: "accessControl",
				icon: ShieldX,
			},
			// {
			// 	href: "/settings",
			// 	label: "settings",
			// 	icon: Settings,
			// },
		],
	},
];
