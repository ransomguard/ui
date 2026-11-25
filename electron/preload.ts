import { ipcRenderer, contextBridge } from "electron";



const generateSubscription = <T>(eventName: string, callback: (data: T) => void) => {
	const subscription = (_event: Electron.IpcRendererEvent, data: T) => callback(data);

	ipcRenderer.on(eventName, subscription);

	return () => {
		ipcRenderer.removeListener(eventName, subscription);
	};
};



contextBridge.exposeInMainWorld("electronAPI", {
	getWorkerHealth() { return ipcRenderer.invoke("engine:worker-health"); },
 getProgramAllowlist(){return ipcRenderer.invoke("program:list");},
 renameProgramAllowlist(id:string,name:string){return ipcRenderer.invoke("program:rename",id,name);},
 addProgramAllowlist(){return ipcRenderer.invoke("program:add");},
 removeProgramAllowlist(id:string){return ipcRenderer.invoke("program:remove",id);},
 resetLossCounter(){return ipcRenderer.invoke("loss:reset");},
 getRecoveryScopeStatus(){return ipcRenderer.invoke("recovery:scope-status");},
 getJevKeyStatus(){return ipcRenderer.invoke("jev:key-status");},
 setJevApiKey(key:string){return ipcRenderer.invoke("jev:set-key",key);},
 closeBackendTrace(kind: "kernel"|"decision"|"response") { return ipcRenderer.invoke("backend-trace:close",kind); },
 openBackendTrace(kind: "kernel"|"decision"|"response") { return ipcRenderer.invoke("backend-trace:open",kind); },
 getConsoleSettings() { return ipcRenderer.invoke("console:get"); },
 getRecoverySettings() { return ipcRenderer.invoke("recovery:get-settings"); },
 getSnapshotSettings() { return ipcRenderer.invoke("snapshot:get-settings"); },
 setSnapshotInterval(minutes:number) { return ipcRenderer.invoke("snapshot:set-interval",minutes); },
 openSnapshotConsole() { return ipcRenderer.invoke("snapshot:open-console"); },
 previewSnapshotRestore(id:string) { return ipcRenderer.invoke("snapshot:restore-preview",id); },
 executeSnapshotRestore(token:string,confirmed:boolean) { return ipcRenderer.invoke("snapshot:restore-execute",token,confirmed); },
 getSnapshotInventory() { return ipcRenderer.invoke("snapshot:list"); },
 createManualSnapshot(requestId:string) { return ipcRenderer.invoke("snapshot:manual",requestId); },
 setSnapshotProtection(snapshotId:string,enabled:boolean) { return ipcRenderer.invoke("snapshot:protect",snapshotId,enabled); },
 chooseRecoveryFolder() { return ipcRenderer.invoke("recovery:choose-folder"); },
 setRecoverySettings(request: {folder:string;acknowledgeFolderRevert:boolean;snapshotBudgetGiB:number}) { return ipcRenderer.invoke("recovery:set-settings",request); },
 setConsoleSettings(value: {visible: boolean; collectOwnDbEvents: boolean}) { return ipcRenderer.invoke("console:set", value); },
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

