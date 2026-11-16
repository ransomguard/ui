import { ipcMain } from "electron";

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
	setWhitelist,
	refreshWhitelist,
} from "./firewall-tool";
import {
	getCachedUpdateStatus,
	restartAndInstall,
	checkForUpdates,
} from "./updater";



export function registerIpcHandlers(): void {
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
