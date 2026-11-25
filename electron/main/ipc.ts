import {getProgramAllowlist,addProgramAllowlist,removeProgramAllowlist,renameProgramAllowlist} from "./recovery-settings";
import {resetLossCounter} from "./recovery-settings";
import {getRecoveryScopeStatus,getJevKeyStatus,setJevApiKey} from "./recovery-settings";
import { openBackendTrace, closeBackendTrace } from "./backend-trace";
import { getConsoleSettings, getWorkerHealth, setConsoleSettings } from "./console-settings";
import { ipcMain } from "electron";
import { previewSnapshotRestore, executeSnapshotRestore, chooseRecoveryFolder, getRecoverySettings, setRecoverySettings, getSnapshotSettings, setSnapshotInterval, openSnapshotConsole, getSnapshotInventory, createManualSnapshot, setSnapshotProtection } from "./recovery-settings";

import { dashboardTimeRange } from "~/store";
import { getLastEngineStatus } from "./ipc-receiver";
import {
	fetchSecurityLogs,
	fetchSecurityLogsAround,
	acknowledgeThreats,
	getDashboardChartStats,
	type FetchSecurityLogsOptions,
} from "./queries";
import {
	fetchLogs,
	fetchLogsAround,
	getFirewallStatus,
	addWhitelist,
	removeWhitelist,
	setWhitelist,
	refreshWhitelist,
} from "./firewall-tool";
import {
	getCachedUpdateStatus,
	restartAndInstall,
	checkForUpdates,
} from "./updater";



export function registerIpcHandlers(): void {
	ipcMain.handle("engine:worker-health", () => getWorkerHealth());
 ipcMain.handle("program:list",()=>getProgramAllowlist());
 ipcMain.handle("program:rename",(_event,id:string,name:string)=>renameProgramAllowlist(id,name));
 ipcMain.handle("program:add",()=>addProgramAllowlist());
 ipcMain.handle("program:remove",(_event,id:string)=>removeProgramAllowlist(id));
 ipcMain.handle("loss:reset",()=>resetLossCounter());
 ipcMain.handle("recovery:scope-status",()=>getRecoveryScopeStatus());
 ipcMain.handle("jev:key-status",()=>getJevKeyStatus());
 ipcMain.handle("jev:set-key",(_,key)=>setJevApiKey(key));
 ipcMain.handle("snapshot:restore-preview", (_, id) => previewSnapshotRestore(id));
 ipcMain.handle("snapshot:restore-execute", (_, token, confirmed) => executeSnapshotRestore(token,confirmed));
 ipcMain.handle("snapshot:list", () => getSnapshotInventory());
 ipcMain.handle("snapshot:manual", (_, id) => createManualSnapshot(id));
 ipcMain.handle("snapshot:protect", (_, id, enabled) => setSnapshotProtection(id,enabled));
 ipcMain.handle("snapshot:get-settings", () => getSnapshotSettings());
 ipcMain.handle("snapshot:set-interval", (_, minutes) => setSnapshotInterval(minutes));
 ipcMain.handle("snapshot:open-console", () => openSnapshotConsole());
 ipcMain.handle("recovery:choose-folder", () => chooseRecoveryFolder());
 ipcMain.handle("recovery:get-settings", () => getRecoverySettings());
 ipcMain.handle("recovery:set-settings", (_, request) => setRecoverySettings(request));
 ipcMain.handle("backend-trace:close", (_, kind) => closeBackendTrace(kind));
 ipcMain.handle("backend-trace:open", (_, kind) => openBackendTrace(kind));
 ipcMain.handle("console:get", () => getConsoleSettings());
 ipcMain.handle("console:set", (_, value) => setConsoleSettings(value));
	ipcMain.handle("initial:get-engine-status", getLastEngineStatus);
	ipcMain.handle("security-logs:fetch", (_, options?: FetchSecurityLogsOptions) => fetchSecurityLogs(options));
	ipcMain.handle("security-logs:fetch-around", (_, targetTimestamp: number, types?: Parameters<typeof fetchSecurityLogsAround>[1], limit?: number) =>
		fetchSecurityLogsAround(targetTimestamp, types, limit)
	);
	ipcMain.handle("threats:acknowledge", (_, timestamp?: number) => acknowledgeThreats(timestamp));

	ipcMain.handle("firewall:fetch-logs", (_, options) => fetchLogs(options));
	ipcMain.handle("firewall:fetch-logs-around", (_, targetTimestamp: number, limit?: number) =>
		fetchLogsAround(targetTimestamp, limit)
	);
	ipcMain.handle("firewall:status", () => getFirewallStatus());
	ipcMain.handle("firewall:add-whitelist", (_, items: string[], reason?: string) => addWhitelist(items, reason));
	ipcMain.handle("firewall:remove-whitelist", (_, items: string[], reason?: string) => removeWhitelist(items, reason));
	ipcMain.handle("firewall:set-whitelist", (_, items: string[], reason?: string) => setWhitelist(items, reason));
	ipcMain.handle("firewall:refresh-whitelist", () => refreshWhitelist());

	ipcMain.handle("dashboard-time-range:set", (_, days: number) => {
		dashboardTimeRange.set(days);
	});
	ipcMain.handle("dashboard-time-range:get", () => dashboardTimeRange.get());
	ipcMain.handle("dashboard-chart-stats:get", (_, days: number, interval: string) =>
		getDashboardChartStats({ days, interval })
	);

	ipcMain.handle("updater:get-status", () => getCachedUpdateStatus());
	ipcMain.handle("updater:restart", () => restartAndInstall());
	ipcMain.handle("updater:check", () => checkForUpdates());
}
