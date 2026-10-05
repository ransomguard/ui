import { ipcMain } from "electron";

import { fetchIPs, actionAndLogging } from "./firewall-tool";



export function registerIpcHandlers(): void {
	ipcMain.handle("firewall:block-list", () => fetchIPs("block"));
	ipcMain.handle("firewall:block-add", (_, obj) => actionAndLogging("block", "add", obj));
	ipcMain.handle("firewall:block-remove", (_, obj) => actionAndLogging("block", "remove", obj));
	ipcMain.handle("firewall:whitelist-list", () => fetchIPs("whitelist"));
	ipcMain.handle("firewall:whitelist-add", (_, obj) => actionAndLogging("whitelist", "add", obj));
	ipcMain.handle("firewall:whitelist-remove", (_, obj) => actionAndLogging("whitelist", "remove", obj));
}
