export interface AboutDetailData {
	title: string;
	message: string;
	copy: string;
	close: string;
}

export interface TrayNotificationTranslations {
	processBlockedTitle: string;
	processBlockedBody: string;
	ruleId: string;
	ruleBlocked: string;
	vssAttemptTitle: string;
	vssAttemptBody: string;
	alertBlockedTitle: string;
	alertQuarantinedTitle: string;
	alertBody: string;
	restoreCompletedTitle: string;
	restoreFailedTitle: string;
	restoreBody: string;
	moreEvents: string;
}



export interface MenuTranslations {
	tray: {
		open: string;
		quit: string;
		notifications: TrayNotificationTranslations;
	};
	menu: {
		language: string;
		english: string;
		korean: string;

		// 최상위 탭
		file: string;
		view: string;
		window: string;
		help: string;

		// File 하위
		quit: string;

		// View 하위
		reload: string;
		forceReload: string;
		toggleDevTools: string;
		resetZoom: string;
		zoomIn: string;
		zoomOut: string;
		toggleFullscreen: string;

		// Window 하위
		close: string;
		minimize: string;
		zoomWindow: string;

		// Help 하위
		github: string;
		about: string;
		aboutData: AboutDetailData;
	};
}
