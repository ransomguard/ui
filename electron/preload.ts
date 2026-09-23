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
			"language-changed",
			(newLang: string) => callback(newLang),
		);
	},
});
