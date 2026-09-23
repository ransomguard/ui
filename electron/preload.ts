// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ipcRenderer, contextBridge } from "electron";



contextBridge.exposeInMainWorld("electronAPI", {
});
