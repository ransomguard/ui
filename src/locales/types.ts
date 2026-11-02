export interface AppTranslations {
	sidebar: {
		open: string;
		close: string;
	};

	nav: {
		notFound: string;
		dashboard: string;
		alerts: string;
		telemetry: string;
		accessControl: string;
	};

	notFound: {
		title: string;
		goHome: string;
	};

	engine: {
		statusLabel: string;
		kernelVersion: string;
		clearThreats: string;
		eventsDropped: string;
		statuses: {
			SECURE: { title: string; description: string };
			AUDIT_ONLY: { title: string; description: string };
			DEGRADED: { title: string; description: string };
			OFFLINE: { title: string; description: string };
			THREAT_BLOCKED: { title: string; description: string };
		};
	};

	stats: {
		processesBlocked: string;
		processesBlockedDesc: string;
		processesTerminated: string;
		processesTerminatedDesc: string;
		filesRecovered: string;
		filesRecoveredDesc: string;
		queueDepth: string;
		queueDepthDesc: string;
		eventsDropped: string;
		eventsDroppedDesc: string;
	};

	timeRange: {
		lastDays: string;
		lastDay: string;
	};

	table: {
		filterPlaceholder: string;
		rowsPerPage: string;
		pageOf: string;
		selectedRows: string;
		noResults: string;
		firstPage: string;
		previousPage: string;
		nextPage: string;
		lastPage: string;
		columns: string;
	};

	chart: {
		heading: string;
		description: string;
		visitors: string;
		tabs: {
			threat: string;
			telemetry: string;
			health: string;
			all: string;
		};
		threat: string;
		processTerminated: string;
		recovery: string;
		fileRename: string;
		fileWrite: string;
		processCreate: string;
		firewall: string;
		queueDepth: string;
		eventsDropped: string;
	};

	recentEvents: {
		heading: string;
		searchPlaceholder: string;
		defaultReason: string;
		threatScoreSummary: string;
		ruleSummary: string;
		pidPpidSummary: string;
		pidExtSummary: string;
		pidSummary: string;
		tabs: {
			all: string;
			threat: string;
			recovery: string;
			telemetry: string;
			firewall: string;
		};
		columns: {
			category: string;
			action: string;
			target: string;
			summary: string;
			timestamp: string;
		};
		categories: {
			threat: string;
			recovery: string;
			telemetry: string;
			firewall: string;
		};
	};

	alerts: {
		heading: string;
		description: string;
		tableHeading: string;
		threatCount: string;
		recoveryCount: string;
		searchPlaceholder: string;
		filters: {
			all: string;
			threats: string;
			recovery: string;
		};
		columns: {
			createdAt: string;
			action: string;
			matchedRule: string;
			processName: string;
			imagePath: string;
			threatScore: string;
			source: string;
		};
		sheet: {
			title: string;
			description: string;
			createdAt: string;
			actionResult: string;
			processId: string;
			processName: string;
			imagePath: string;
			matchedRule: string;
			threatScore: string;
			rawJson: string;
		};
		empty: {
			title: string;
			description: string;
		};
		card: {
			source: string;
			threatScore: string;
			rawJson: string;
		};
		sources: {
			kernelDriver: string;
			correlationEngine: string;
			vssFilter: string;
			vssRestoreEngine: string;
		};
		defaults: {
			ruleId: string;
			ruleBlocked: string;
			vssTamperAttempt: string;
			vssBackupRestore: string;
		};
	};

	telemetry: {
		heading: string;
		description: string;
		tableHeading: string;
		searchPlaceholder: string;
		sourceKernelDriver: string;
		matchedRuleId: string;
		columns: {
			createdAt: string;
			action: string;
			processId: string;
			processName: string;
			imagePath: string;
			source: string;
		};
		sheet: {
			title: string;
			description: string;
			createdAt: string;
			actionResult: string;
			processId: string;
			processName: string;
			imagePath: string;
			matchedRule: string;
			rawJson: string;
		};
	};

	accessControl: {
		heading: string;
		description: string;
		addPolicy: string;
		statusActive: string;
		statusInactive: string;
		statusActiveDesc: string;
		statusInactiveDesc: string;
		refreshButton: string;
		refreshing: string;
		tabs: {
			whitelistedTargets: string;
			blockedProcesses: string;
			accessLogs: string;
		};
		dialog: {
			whitelistTitle: string;
			description: string;
			whitelistIpLabel: string;
			whitelistIpPlaceholder: string;
			whitelistDescLabel: string;
			whitelistDescPlaceholder: string;
			helpExamples: string;
			cancel: string;
			submit: string;
		};
		whitelistTable: {
			heading: string;
			searchPlaceholder: string;
			columns: {
				type: string;
				target: string;
				port: string;
				cidr: string;
				resolvedIps: string;
				description: string;
				addedAt: string;
				actions: string;
			};
			allPorts: string;
			removeAction: string;
		};
		blockedProcessesTable: {
			heading: string;
			searchPlaceholder: string;
			columns: {
				processId: string;
				processName: string;
				imagePath: string;
				reason: string;
				source: string;
				blockedAt: string;
			};
		};
		logsTable: {
			heading: string;
			searchPlaceholder: string;
			columns: {
				performedAt: string;
				target: string;
				action: string;
				ipAddress: string;
				reason: string;
				status: string;
			};
			targets: {
				block: string;
				whitelist: string;
			};
			actions: {
				add: string;
				remove: string;
			};
			statuses: {
				success: string;
				failed: string;
			};
		};
		deleteDialog: {
			title: string;
			description: string;
			cancel: string;
			confirm: string;
		};
		sheet: {
			title: string;
			description: string;
			type: string;
			targetValue: string;
			port: string;
			cidr: string;
			domain: string;
			ipAddress: string;
			ipv4List: string;
			ipv6List: string;
			addedAt: string;
			ruleDescription: string;
			ipcData: string;
			rawJson: string;
			none: string;
		};
		defaults: {
			manualWhitelistDesc: string;
			externalWhitelistDesc: string;
			manualRemoveWhitelistReason: string;
		};
		toasts: {
			invalidTarget: string;
			whitelistAdded: string;
			whitelistRemoved: string;
			refreshSuccess: string;
		};
	};
}
