import type { AppTranslations } from "./types";

export const en: AppTranslations = {
	sidebar: {
		open: "Open Sidebar",
		close: "Close Sidebar",
	},

	nav: {
		notFound: "404 Not Found",
		dashboard: "Dashboard",
		alerts: "Threats & Recovery",
		telemetry: "Event Logs",
		accessControl: "Access & Exception Control",
	},

	notFound: {
		title: "Page Not Found",
		goHome: "Go Home",
	},

	engine: {
		statusLabel: "PC Security Status",
		kernelVersion: "Kernel Version: v{{ version }}",
		clearThreats: "Acknowledge Threats",
		eventsDropped: "(Events dropped: {{ count }})",
		statuses: {
			SECURE: {
				title: "Real-time Protection Active",
				description: "Kernel driver is active and protecting your system safely.",
			},
			AUDIT_ONLY: {
				title: "Audit Only Mode",
				description: "Monitoring and logging events without active blocking.",
			},
			DEGRADED: {
				title: "Protection Degraded",
				description: "Kernel engine event drop or system overload detected.",
			},
			OFFLINE: {
				title: "Engine Offline",
				description: "Engine service is stopped or disconnected from kernel driver.",
			},
			THREAT_BLOCKED: {
				title: "Threat Detected & Blocked",
				description: "Suspicious ransomware behavior or threat has been blocked.",
			},
		},
	},

	stats: {
		processesBlocked: "Processes Blocked",
		processesBlockedDesc: "Number of processes blocked by real-time protection",
		processesTerminated: "Processes Terminated",
		processesTerminatedDesc: "Number of processes terminated due to threat activity",
		queueDepth: "Queue Depth",
		queueDepthDesc: "Current pending kernel event queue size",
		eventsDropped: "Events Dropped",
		eventsDroppedDesc: "Number of events dropped due to queue overflow",
	},

	timeRange: {
		lastDays: "Last {{ days }} days",
		lastDay: "Last 1 day",
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

	chart: {
		heading: "Threat Detection Trend",
		description: "Detection and block event statistics for {{ timeRange }}",
		visitors: "Events",
		desktop: "Blocked",
		mobile: "Monitored",
	},

	recentEvents: {
		heading: "Recent Security Events Summary",
		searchPlaceholder: "Search target, event type, or summary...",
		defaultReason: "Manual block by administrator",
		threatScoreSummary: "{{ ruleName }} • Threat Score {{ score }}",
		ruleSummary: "Rule #{{ ruleId }} (PID: {{ pid }})",
		pidPpidSummary: "PID: {{ pid }} • PPID: {{ ppid }}",
		pidExtSummary: "PID: {{ pid }} • Ext: {{ ext }}",
		pidSummary: "PID: {{ pid }}",
		tabs: {
			all: "All",
			threat: "Threats",
			recovery: "Recovery",
			telemetry: "Events",
			firewall: "Firewall",
		},
		columns: {
			category: "Category",
			action: "Type",
			target: "Target",
			summary: "Summary",
			timestamp: "Timestamp",
		},
		categories: {
			threat: "Threat",
			recovery: "Recovery",
			telemetry: "Event",
			firewall: "Firewall",
		},
	},

	alerts: {
		heading: "Security Alerts & Recovery",
		description: "Review kernel blocks, ransomware detections, and VSS backup/restore events in a real-time feed.",
		threatCount: "Threats: {{ count }}",
		recoveryCount: "Recovered: {{ count }}",
		searchPlaceholder: "Search process, rule, or path...",
		filters: {
			all: "View All Events",
			threats: "Threats & Blocks Only",
			recovery: "Recovery Events Only",
		},
		empty: {
			title: "No Security Alerts Detected",
			description: "Your system is currently secure. Real-time threat and recovery alerts will appear here immediately.",
		},
		card: {
			source: "Source: {{ source }}",
			threatScore: "Threat Score",
			rawJson: "View Raw Metadata JSON",
		},
		sources: {
			kernelDriver: "Kernel Driver",
			correlationEngine: "Correlation Engine",
			vssFilter: "VSS Filter",
			vssRestoreEngine: "VSS Restore Engine",
		},
		defaults: {
			ruleId: "Rule #{{ id }}",
			ruleBlocked: "Rule-Blocked",
			vssTamperAttempt: "VSS Shadow Copy Tamper Attempt",
			vssBackupRestore: "VSS Backup/Restore",
		},
	},

	telemetry: {
		heading: "Event Telemetry Viewer",
		description: "Inspect high-density process creation, file I/O, and raw events from the kernel driver and minifilter.",
		tableHeading: "Event Log Telemetry (Click any row to inspect details)",
		searchPlaceholder: "Search process name, image path, or rule...",
		sourceKernelDriver: "Kernel Driver",
		matchedRuleId: "Rule #{{ id }}",
		columns: {
			createdAt: "Created At",
			action: "Event Type",
			processId: "PID",
			processName: "Process Name",
			imagePath: "Target Image / File Path",
			source: "Event Source",
		},
		sheet: {
			title: "Event Metadata Inspection",
			description: "Event ID #{{ id }} • {{ source }}",
			createdAt: "Created At",
			actionResult: "Action Result",
			processId: "Process ID (PID)",
			processName: "Process Name",
			imagePath: "Target Executable Image Path",
			matchedRule: "Matched Rule",
			rawJson: "Raw JSON Details",
		},
	},

	accessControl: {
		heading: "Access & Policy Control",
		description: "Manage firewall blocked/whitelisted IP lists and review policy change logs.",
		addPolicy: "Add Policy / IP",
		tabs: {
			blockedIps: "Blocked IPs ({{ count }})",
			whitelistedIps: "Whitelisted IPs ({{ count }})",
			accessLogs: "Access Control Logs ({{ count }})",
		},
		dialog: {
			blockTitle: "Manual IP Block",
			whitelistTitle: "Register Whitelisted IP",
			description: "Register a new IP address to apply immediately to firewall security policies.",
			blockIpLabel: "IPv4 Address to Block",
			blockIpPlaceholder: "e.g. 192.168.1.100",
			blockReasonLabel: "Block Reason",
			blockReasonPlaceholder: "Enter reason (e.g. Manual block for suspicious IP)",
			whitelistIpLabel: "IPv4 Address to Allow",
			whitelistIpPlaceholder: "e.g. 10.0.0.50",
			whitelistDescLabel: "Description / Identifier",
			whitelistDescPlaceholder: "e.g. Trusted development server",
			cancel: "Cancel",
			submit: "Register",
		},
		blockedTable: {
			heading: "Blocked IP Address List",
			searchPlaceholder: "Search IP address or block reason...",
			columns: {
				ipAddress: "Blocked IP Address",
				reason: "Reason",
				blockedAt: "Blocked At",
				actions: "Actions",
			},
			unblockAction: "Unblock",
		},
		whitelistTable: {
			heading: "Whitelisted IP Address List",
			searchPlaceholder: "Search IP address or description...",
			columns: {
				ipAddress: "Whitelisted IP Address",
				description: "Description / Identifier",
				addedAt: "Added At",
				actions: "Actions",
			},
			removeAction: "Remove",
		},
		logsTable: {
			heading: "Firewall Access Control Change Logs",
			searchPlaceholder: "Search IP address, reason, or action type...",
			columns: {
				performedAt: "Performed At",
				target: "Policy Target",
				action: "Action Type",
				ipAddress: "Target IP Address",
				reason: "Reason / Description",
				status: "Status",
			},
			targets: {
				block: "Blocked IP",
				whitelist: "Whitelisted IP",
			},
			actions: {
				add: "ADD",
				remove: "REMOVE",
			},
			statuses: {
				success: "Success",
				failed: "Failed",
			},
		},
		deleteDialog: {
			title: "Confirm Policy Removal",
			description: "Are you sure you want to remove the selected policy/IP ({{ item }})? This will take effect immediately.",
			cancel: "Cancel",
			confirm: "Remove",
		},
		defaults: {
			manualBlockReason: "Manual block by administrator",
			manualWhitelistDesc: "Manual allow by administrator",
			manualUnblockReason: "Manual unblock",
			manualRemoveWhitelistReason: "Manual whitelist removal",
		},
		toasts: {
			invalidIp: "Please enter a valid IPv4 address format.",
			blockedAdded: "IP address {{ ip }} has been added to the blocked list.",
			whitelistAdded: "IP address {{ ip }} has been added to the whitelist.",
			blockedRemoved: "Blocked IP {{ ip }} has been unblocked.",
			whitelistRemoved: "Whitelisted IP {{ ip }} has been removed.",
		},
	},
};
