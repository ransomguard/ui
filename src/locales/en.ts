import type { AppTranslations } from "./types";

export const en: AppTranslations = {
	heading: {
		dashboard: "Dashboard",
		notFound: "404 Not Found",
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
		errors: {
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
