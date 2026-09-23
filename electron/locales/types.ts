export interface AboutDetailData {
	title: string;
	message: string;
	copy: string;
	close: string;
}



export interface MenuTranslations {
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
