/// <reference types="vite-plugin-electron/electron-env"/>

declare namespace NodeJS {
	interface ProcessEnv {
		/**
		 * The built directory structure
		 *
		 * ```tree
		 * └─┬─┬ dist
		 *   │ └── index.html
		 *   │
		 *   └─┬ dist-electron
		 *     ├── main.js
		 *     └── preload.js
		 *
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
type FetchSecurityLogsOptions = import("~/main/queries").FetchSecurityLogsOptions;
type FetchAccessControlLogsOptions = import("~/main/queries").FetchAccessControlLogsOptions;

type FirewallRequest = import("~/services/firewall-tool").FirewallRequest;
type IncomingFWMessage = import("~/services/firewall-tool").IncomingFWMessage;
type WhitelistItem = import("~/services/firewall-tool").WhitelistItem;
type WhitelistItemType = import("~/services/firewall-tool").WhitelistItemType;
type WhitelistItemData = import("~/services/firewall-tool").WhitelistItemData;
type FetchLogsResult = Awaited<ReturnType<typeof import("~/main/firewall-tool").fetchLogs>>;
type AccessControlLogItem = import("~/main/firewall-tool").AccessControlLogItem;

interface Window {
	electronAPI: {
		onLanguageChanged(callback: OnLanguageChangedCallback): Unsubscribe;
		setLanguage(lang: string): Promise<void>;
		getLanguage(): Promise<string>;

		onSecurityLogsUpdated(callback: OnSecurityLogsUpdatedCallback): Unsubscribe;
		getEngineStatus(): Promise<GetLastEngineStatusData>;
		getSecurityLogs(options?: FetchSecurityLogsOptions): Promise<IncomingIPCMessage[]>;
		getSecurityLogsAround(
			targetTimestamp: number,
			types?: import("~/db/schema/security-logs").SecurityLogType[],
			limit?: number
		): Promise<{
			logs: IncomingIPCMessage[];
			hasMoreTop: boolean;
			hasMoreBottom: boolean;
			topOffset?: number;
		}>;
		acknowledgeThreats(timestamp?: number): Promise<boolean>;

		getAccessControlLogs(options?: FetchAccessControlLogsOptions): Promise<FetchLogsResult>;
		getAccessControlLogsAround(
			targetTimestamp: number,
			limit?: number
		): Promise<{
			logs: AccessControlLogItem[];
			hasMoreTop: boolean;
			hasMoreBottom: boolean;
			topOffset?: number;
		}>;
		getFirewallStatus(): Promise<IncomingFWMessage>;
		setWhitelist(items: string[], reason?: string): Promise<{
			success: boolean;
			active: boolean;
			whitelist?: WhitelistItem[];
			message?: string;
			logs: AccessControlLogItem[];
		}>;
		refreshWhitelist(): Promise<IncomingFWMessage>;
	};
}
