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

	getAccessControlLogs(...args: unknown[]) {
		return ipcRenderer.invoke("firewall:fetch-logs", ...args);
	},
	getBlockedIPs(...args: unknown[]) {
		return ipcRenderer.invoke("firewall:block-list", ...args);
	},
	addBlockedIPs(...args: unknown[]) {
		return ipcRenderer.invoke("firewall:block-add", ...args);
	},
	removeBlockedIPs(...args: unknown[]) {
		return ipcRenderer.invoke("firewall:block-remove", ...args);
	},
	getWhitelistedIPs(...args: unknown[]) {
		return ipcRenderer.invoke("firewall:whitelist-list", ...args);
	},
	addWhitelistedIPs(...args: unknown[]) {
		return ipcRenderer.invoke("firewall:whitelist-add", ...args);
	},
	removeWhitelistedIPs(...args: unknown[]) {
		return ipcRenderer.invoke("firewall:whitelist-remove", ...args);
	},
});
