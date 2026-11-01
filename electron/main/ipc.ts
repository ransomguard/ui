import { ipcMain } from "electron";

import { getLastEngineStatus } from "./ipc-receiver";
import {
	fetchSecurityLogs,
	fetchSecurityLogsAround,
	acknowledgeThreats,
	type FetchSecurityLogsOptions,
} from "./queries";
import { fetchLogs, fetchLogsAround, fetchIPs, actionAndLogging } from "./firewall-tool";



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
	ipcMain.handle("firewall:block-list", () => fetchIPs("block"));
	ipcMain.handle("firewall:block-add", (_, ...args) => actionAndLogging("block", "add", ...args));
	ipcMain.handle("firewall:block-remove", (_, ...args) => actionAndLogging("block", "remove", ...args));
	ipcMain.handle("firewall:whitelist-list", () => fetchIPs("whitelist"));
	ipcMain.handle("firewall:whitelist-add", (_, ...args) => actionAndLogging("whitelist", "add", ...args));
	ipcMain.handle("firewall:whitelist-remove", (_, ...args) => actionAndLogging("whitelist", "remove", ...args));
}
