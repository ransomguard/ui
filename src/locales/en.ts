import type { AppTranslations } from "./types";

export const en: AppTranslations = {
	sidebar: {
		open: "Open Sidebar",
		close: "Close Sidebar",
		login: "Login",
		logout: "Logout",
		userMenu: {
			profile: "Profile",
			settings: "Settings",
		},
	},

	nav: {
		notFound: "404 Not Found",
		dashboard: "Dashboard",
		protectedFolders: "Protected Folders",
		threats: "Threats History",
		settings: "Settings",
	},

	stats: {
		total: "Total",
		totalVisitors: "Total Visitors",
		desktop: "Desktop",
		desktopVisitors: "{{ percent }}% of total",
		mobile: "Mobile",
		mobileVisitors: "{{ percent }}% of total",
		dailyAverage: "Daily Average",
		avgVisitorsPerDay: "Average visitors per day",
	},
	timeRange: {
		last90Days: "Last 3 months",
		last30Days: "Last 30 days",
		last7Days: "Last 7 days",
	},
	chart: {
		heading: "Area Chart",
		description: "Showing total visitors for the {{ timeRange }}",
		visitors: "Visitors",
		desktop: "Desktop",
		mobile: "Mobile",
	},
	ipBlock: {
		heading: "Blocked IP List",
		columns: {
			ipAddress: "IP Address",
			blockType: "Block Type",
			reason: "Reason",
			blockedAt: "Blocked At",
		},
		type: {
			manual: "Manual",
			auto: "Auto Detected",
		},
		searchPlaceholder: "Search IP address or reason...",
		unblock: "Unblock",
		addBlockedIp: "Add Blocked IP",
		dialogTitle: "Manual IP Block",
		dialogDescription: "Enter the IP address and reason to manually block.",
		cancel: "Cancel",
		addBlock: "Add Block",
		defaultReason: "Manual block by administrator",
		confirmUnblock: {
			title: "Confirm Unblock IP",
			description: "Are you sure you want to unblock {{ count }} selected IP address(es)?",
			action: "Unblock",
		},
		successes: {
			title: "Successfully {{ action }} blocked IP",
			added: "IP address {{ ip }} has been successfully added to the blocked list.",
			removed: "{{ count }} IP addresses have been successfully removed from the blocked list.",
		},
		errors: {
			title: "Failed to add blocked IP",
			emptyIp: "Please enter an IP address.",
			invalidIp: "Invalid IPv4 address format (e.g. 192.168.1.100).",
			duplicateIp: "This IP address is already blocked.",
		},
	},
	table: {
		filterPlaceholder: "Filter...",
		rowsPerPage: "Rows per page",
		pageOf: "Page {{ page }} of {{ total }}",
		selectedRows: "{{ selected }} of {{ total }} row(s) selected.",
		noResults: "No results.",
		firstPage: "Go to first page",
		previousPage: "Go to previous page",
		nextPage: "Go to next page",
		lastPage: "Go to last page",
		columns: "Columns",
	},
};
