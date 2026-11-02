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
	setWhitelist(items: string[], reason?: string) {
		return ipcRenderer.invoke("firewall:set-whitelist", items, reason);
	},
	refreshWhitelist() {
		return ipcRenderer.invoke("firewall:refresh-whitelist");
	},
});
