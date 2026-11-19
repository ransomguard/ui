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
 getProgramAllowlist():Promise<{entries:{id:string;path:string;sha256:string;created:number}[]}>;
 addProgramAllowlist():Promise<Awaited<ReturnType<Window["electronAPI"]["getProgramAllowlist"]>>|null>;
 removeProgramAllowlist(id:string):ReturnType<Window["electronAPI"]["getProgramAllowlist"]>;
 resetLossCounter():Promise<{baseline:number;sinceReset:number;resetAt:number}>;
 getRecoveryScopeStatus():Promise<{configured:boolean}>;
 getJevKeyStatus():Promise<{configured:boolean}>;
 setJevApiKey(key:string):Promise<{configured:boolean}>;
 closeBackendTrace(kind: "kernel"|"decision"|"response"): Promise<void>;
 openBackendTrace(kind: "kernel"|"decision"|"response"): Promise<void>;
 getConsoleSettings(): Promise<{visible: boolean; collectOwnDbEvents: boolean}>;
 getRecoverySettings(): Promise<{protectedRoot:string;ready:boolean;reason:string;detail:string;snapshotBudgetGiB:number;files:number;blockedReason:string|null;automaticResponse:boolean}>;
 chooseRecoveryFolder(): Promise<string|null>;
 getSnapshotSettings(): Promise<{intervalMinutes:number;task:{interval?:string;nextRun?:string;lastResult?:number};error:string|null}>;
 setSnapshotInterval(minutes:number): ReturnType<Window["electronAPI"]["getSnapshotSettings"]>;
 openSnapshotConsole(): Promise<{viewer_pid:number}>;
 previewSnapshotRestore(id:string): Promise<{token:string;snapshotId:string;createdAt:string;folder:string;files:string[];bytes:number;expires:number}>;
 executeSnapshotRestore(token:string,confirmed:boolean): Promise<{verified:boolean;filesVerified:number;filesFailed:number;jobId:string;source:string}>;
 getSnapshotInventory(): Promise<{snapshots:{snapshot_id:string;volume_id:string;created_at:string;manual:boolean;userProtected:boolean;systemProtected:boolean;minimumKeep:boolean;protected:boolean}[];errors:{volume:string;error:string}[]}>;
 createManualSnapshot(requestId:string): Promise<{created:boolean;status:string;reason:string;requires_reconciliation?:boolean;duplicate_request?:boolean;schedule_warning?:string;snapshot?:{snapshot_id:string}}>;
 setSnapshotProtection(snapshotId:string,enabled:boolean): ReturnType<Window["electronAPI"]["getSnapshotInventory"]>;
 setRecoverySettings(request:{folder:string;acknowledgeFolderRevert:boolean;snapshotBudgetGiB:number}): ReturnType<Window["electronAPI"]["getRecoverySettings"]>;
 setConsoleSettings(value: {visible: boolean; collectOwnDbEvents: boolean}): Promise<{visible: boolean; collectOwnDbEvents: boolean}>;
		onLanguageChanged(callback: OnLanguageChangedCallback): Unsubscribe;
		setLanguage(lang: string): Promise<void>;
		getLanguage(): Promise<string>;

		setDashboardTimeRange(days: number): Promise<void>;
		getDashboardTimeRange(): Promise<number | undefined>;
		getDashboardChartStats(days: number, interval: string): Promise<import("~/main/queries").DailyChartStatsItem[]>;

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
		addWhitelist(items: string[], reason?: string): Promise<{
			success: boolean;
			active: boolean;
			direction?: import("~/services/firewall-tool").FirewallResponseDirection;
			whitelist?: WhitelistItem[];
			message?: string;
			logs: AccessControlLogItem[];
		}>;
		removeWhitelist(items: string[], reason?: string): Promise<{
			success: boolean;
			active: boolean;
			direction?: import("~/services/firewall-tool").FirewallResponseDirection;
			whitelist?: WhitelistItem[];
			message?: string;
			logs: AccessControlLogItem[];
		}>;
		setWhitelist(items: string[], reason?: string): Promise<{
			success: boolean;
			active: boolean;
			direction?: import("~/services/firewall-tool").FirewallResponseDirection;
			whitelist?: WhitelistItem[];
			message?: string;
			logs: AccessControlLogItem[];
		}>;
		refreshWhitelist(): Promise<IncomingFWMessage>;

		getUpdateStatus(): Promise<import("~/main/updater").UpdateStatus>;
		onUpdateStatusChanged(callback: (status: import("~/main/updater").UpdateStatus) => void): Unsubscribe;
		restartAndInstall(): Promise<void>;
		checkForUpdates(): Promise<unknown>;
	};
}

