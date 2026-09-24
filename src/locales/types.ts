export interface AppTranslations {
	sidebar: {
		open: string;
		close: string;
		login: string;
		logout: string;
		userMenu: {
			profile: string;
			settings: string;
		};
	};

	nav: {
		notFound: string;
		dashboard: string;
		protectedFolders: string;
		threats: string;
		settings: string;
	};

	stats: {
		total: string;
		totalVisitors: string;
		desktop: string;
		desktopVisitors: string;
		mobile: string;
		mobileVisitors: string;
		dailyAverage: string;
		avgVisitorsPerDay: string;
	};
	chart: {
		heading: string;
		description: string;
		visitors: string;
		desktop: string;
		mobile: string;
	};
	timeRange: {
		last90Days: string;
		last30Days: string;
		last7Days: string;
	};
	ipBlock: {
		heading: string;
		columns: {
			ipAddress: string;
			blockType: string;
			reason: string;
			blockedAt: string;
		};
		type: {
			manual: string,
			auto: string,
		},
		searchPlaceholder: string;
		unblock: string;
		addBlockedIp: string;
		dialogTitle: string;
		dialogDescription: string;
		cancel: string;
		addBlock: string;
		defaultReason: string;
		successes: {
			title: string;
			added: string;
			removed: string;
		};
		errors: {
			title: string;
			emptyIp: string;
			invalidIp: string;
			duplicateIp: string;
		};
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
}
