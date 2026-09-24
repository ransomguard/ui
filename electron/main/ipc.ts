import { ipcMain } from "electron";
import { turnOnEngine, turnOffEngine } from "../services/engine";
import { fetchAreaChartData } from "../services/chart";
import { fetchBlockedIpData } from "../services/ip-block";



export function registerIpcHandlers(): void {
	ipcMain.handle("start-engine", turnOnEngine);
	ipcMain.handle("stop-engine", turnOffEngine);

	ipcMain.handle("get-main-chart-data", fetchAreaChartData);
	ipcMain.handle("get-blocked-ip-data", fetchBlockedIpData);
}
