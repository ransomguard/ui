import { ipcMain } from "electron";
import { fetchAreaChartData } from "../services/chart";
import { fetchBlockedIpData } from "../services/ip-block";



export function registerIpcHandlers(): void {
	ipcMain.handle("get-main-chart-data", fetchAreaChartData);
	ipcMain.handle("get-blocked-ip-data", fetchBlockedIpData);
}
