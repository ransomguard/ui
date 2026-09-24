import { app } from "electron";

export * from "./env";
import { createWindow } from "./window";
import { setApplicationMenu } from "./menu";
import { connectToEngine } from "./engine";
import { registerIpcHandlers } from "./ipc";



app.whenReady().then(() => {
	registerIpcHandlers();
	const win = createWindow();

	const systemLocale = app.getLocale();
	setApplicationMenu(systemLocale, win);
	connectToEngine(win);
});
