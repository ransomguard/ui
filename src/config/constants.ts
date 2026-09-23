import { LayoutDashboard, FolderLock, ShieldAlert, Settings } from "lucide-react";

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
				href: "/folders",
				label: "protectedFolders",
				icon: FolderLock,
			},
			{
				href: "/threats",
				label: "threats",
				icon: ShieldAlert,
			},
			{
				href: "/settings",
				label: "settings",
				icon: Settings,
			},
		],
	},
];
