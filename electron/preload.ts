import { ipcRenderer, contextBridge } from "electron";



const generateSubscription = <T>(eventName: string, callback: (data: T) => void) => {
	const subscription = (_event: Electron.IpcRendererEvent, data: T) => callback(data);

	ipcRenderer.on(eventName, subscription);

	return () => {
		ipcRenderer.removeListener(eventName, subscription);
	};
};



contextBridge.exposeInMainWorld("electronAPI", {
	onLanguageChanged(callback: OnLanguageChangedCallback) {
		return generateSubscription(
			"language:changed",
			callback,
		);
	},
	setLanguage(lang: string) {
		return ipcRenderer.invoke("language:set", lang);
	},
	getLanguage() {
		return ipcRenderer.invoke("language:get");
	},

	setDashboardTimeRange(days: number) {
		return ipcRenderer.invoke("dashboard-time-range:set", days);
	},
	getDashboardTimeRange() {
		return ipcRenderer.invoke("dashboard-time-range:get");
	},
	getDashboardChartStats(days: number, interval: string) {
		return ipcRenderer.invoke("dashboard-chart-stats:get", days, interval);
	},

	onSecurityLogsUpdated(callback: OnSecurityLogsUpdatedCallback) {
		return generateSubscription(
			"security-logs-updated",
			callback,
		);
	},
	getEngineStatus() {
		return ipcRenderer.invoke("initial:get-engine-status");
	},
	getSecurityLogs(...args: unknown[]) {
		return ipcRenderer.invoke("security-logs:fetch", ...args);
	},
	getSecurityLogsAround(targetTimestamp: number, types?: unknown, limit?: number) {
		return ipcRenderer.invoke("security-logs:fetch-around", targetTimestamp, types, limit);
	},
	acknowledgeThreats(timestamp?: number) {
		return ipcRenderer.invoke("threats:acknowledge", timestamp);
	},

	getAccessControlLogs(...args: unknown[]) {
		return ipcRenderer.invoke("firewall:fetch-logs", ...args);
	},
	getAccessControlLogsAround(targetTimestamp: number, limit?: number) {
		return ipcRenderer.invoke("firewall:fetch-logs-around", targetTimestamp, limit);
	},
	getFirewallStatus() {
		return ipcRenderer.invoke("firewall:status");
	},
	addWhitelist(items: string[], reason?: string) {
		return ipcRenderer.invoke("firewall:add-whitelist", items, reason);
	},
	removeWhitelist(items: string[], reason?: string) {
		return ipcRenderer.invoke("firewall:remove-whitelist", items, reason);
	},
	setWhitelist(items: string[], reason?: string) {
		return ipcRenderer.invoke("firewall:set-whitelist", items, reason);
	},
	refreshWhitelist() {
		return ipcRenderer.invoke("firewall:refresh-whitelist");
	},

	getUpdateStatus() {
		return ipcRenderer.invoke("updater:get-status");
	},
	onUpdateStatusChanged(callback: (status: import("~/main/updater").UpdateStatus) => void) {
		return generateSubscription("updater:status-changed", callback);
	},
	restartAndInstall() {
		return ipcRenderer.invoke("updater:restart");
	},
	checkForUpdates() {
		return ipcRenderer.invoke("updater:check");
	},
});
