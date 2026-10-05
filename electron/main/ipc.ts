import { ipcMain } from "electron";

import { getLastEngineStatus } from "./ipc-receiver";
import { fetchLogs, fetchIPs, actionAndLogging } from "./firewall-tool";



export function registerIpcHandlers(): void {
	ipcMain.handle("initial:get-engine-status", getLastEngineStatus);

	ipcMain.handle("firewall:fetch-logs", () => fetchLogs());
	ipcMain.handle("firewall:block-list", () => fetchIPs("block"));
	ipcMain.handle("firewall:block-add", (_, ...args) => actionAndLogging("block", "add", ...args));
	ipcMain.handle("firewall:block-remove", (_, ...args) => actionAndLogging("block", "remove", ...args));
	ipcMain.handle("firewall:whitelist-list", () => fetchIPs("whitelist"));
	ipcMain.handle("firewall:whitelist-add", (_, ...args) => actionAndLogging("whitelist", "add", ...args));
	ipcMain.handle("firewall:whitelist-remove", (_, ...args) => actionAndLogging("whitelist", "remove", ...args));
}
