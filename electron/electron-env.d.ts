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

type FirewallRequest = import("~/services/firewall-tool").FirewallRequest;
type IncomingFWMessage = import("~/services/firewall-tool").IncomingFWMessage;
type FetchIPsResult = Awaited<ReturnType<typeof import("~/main/firewall-tool").fetchIPs>>;
type ActionAndLoggingResult = Awaited<ReturnType<typeof import("~/main/firewall-tool").actionAndLogging>>;

interface Window {
	electronAPI: {
		onLanguageChanged(callback: OnLanguageChangedCallback): Unsubscribe;
		onSecurityLogsUpdated(callback: OnSecurityLogsUpdatedCallback): Unsubscribe;

		getBlockedIPs(): Promise<FetchIPsResult>;
		getWhitelistedIPs(): Promise<FetchIPsResult>;
		addBlockedIPs(ips: string[], reason: string): Promise<ActionAndLoggingResult>;
		removeBlockedIPs(ips: string[], reason: string): Promise<ActionAndLoggingResult>;
		addWhitelistedIPs(ips: string[], reason: string): Promise<ActionAndLoggingResult>;
		removeWhitelistedIPs(ips: string[], reason: string): Promise<ActionAndLoggingResult>;
	};
}
