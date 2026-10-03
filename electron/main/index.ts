import { app } from "electron";

export * from "./env";
import { createWindow } from "./window";
import { setApplicationMenu } from "./menu";
import { connectToEngine } from "./engine";
import { registerIpcHandlers } from "./ipc";
import { registerExternalIpcHandlers } from "./ipc-receiver";



app.whenReady().then(() => {
	registerIpcHandlers();
	registerExternalIpcHandlers();
	const win = createWindow();

	const systemLocale = app.getLocale();
	setApplicationMenu(systemLocale, win);
	connectToEngine(win);
});
