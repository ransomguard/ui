/// <reference types="vite-plugin-electron/electron-env"/>

declare namespace NodeJS {
	interface ProcessEnv {
		/**
		 * The built directory structure
		 *
		 * ```tree
		 * ├─┬─┬ dist
		 * │ │ └── index.html
		 * │ │
		 * │ ├─┬ dist-electron
		 * │ │ ├── main.js
		 * │ │ └── preload.js
		 * │
		 * ```
		 */
		APP_ROOT: string;
		/** /dist/ or /public/ */
		VITE_PUBLIC: string;
	}
}



// Used in Renderer process, expose in `preload.ts`

type Unsubscribe = () => void;

type OnEngineStatusChangedCallback = (isActive: boolean) => void;
type OnLanguageChangedCallback = (newLang: string) => void;

interface Window {
	electronAPI: {
		onEngineStatusChanged(callback: OnEngineStatusChangedCallback): Unsubscribe;

		onLanguageChanged(callback: OnLanguageChangedCallback): Unsubscribe;

		getMainChartData(): Promise<import("./services/chart").AreaChartDataItem[]>;
		getBlockedIpData(): Promise<import("./services/ip-block").BlockedIpItem[]>;
	};
}
