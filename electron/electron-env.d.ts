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

type OnLanguageChangedCallback = (newLang: string) => void;

type EngineEventType = import("~/services/ipc-receiver").EngineEventType;
type IncomingIPCMessage = import("~/services/ipc-receiver").IncomingIPCMessage;
type ExtractIncomingIPCMessage<
	T extends EngineEventType = EngineEventType,
	M extends IncomingIPCMessage = IncomingIPCMessage,
> = import("~/services/ipc-receiver").ExtractIncomingIPCMessage<T, M>;
type OnSecurityLogsUpdatedCallback = (messages: IncomingIPCMessage[]) => void;
type GetLastEngineStatusData = import("~/main/ipc-receiver").GetLastEngineStatusData;

type FirewallRequest = import("~/services/firewall-tool").FirewallRequest;
type IncomingFWMessage = import("~/services/firewall-tool").IncomingFWMessage;
type FetchLogsResult = Awaited<ReturnType<typeof import("~/main/firewall-tool").fetchLogs>>;
type FetchIPsResult = Awaited<ReturnType<typeof import("~/main/firewall-tool").fetchIPs>>;
type AccessControlLogItem = import("~/main/firewall-tool").AccessControlLogItem;

interface Window {
	electronAPI: {
		onLanguageChanged(callback: OnLanguageChangedCallback): Unsubscribe;
		setLanguage(lang: string): Promise<void>;
		getLanguage(): Promise<string>;

		onSecurityLogsUpdated(callback: OnSecurityLogsUpdatedCallback): Unsubscribe;
		getEngineStatus(): Promise<GetLastEngineStatusData>;

		getAccessControlLogs(): Promise<FetchLogsResult>;
		getBlockedIPs(): Promise<FetchIPsResult>;
		getWhitelistedIPs(): Promise<FetchIPsResult>;
		addBlockedIPs(ips: string[], reason: string): Promise<AccessControlLogItem[]>;
		removeBlockedIPs(ips: string[], reason: string): Promise<AccessControlLogItem[]>;
		addWhitelistedIPs(ips: string[], reason: string): Promise<AccessControlLogItem[]>;
		removeWhitelistedIPs(ips: string[], reason: string): Promise<AccessControlLogItem[]>;
	};
}
