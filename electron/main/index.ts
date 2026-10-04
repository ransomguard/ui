import { app } from "electron";

import { store } from "~/store";

import { createWindow } from "./window";
import { setApplicationMenu } from "./menu";
import { connectToEngine } from "./engine";
import { registerIpcHandlers } from "./ipc";
import { registerExternalIpcHandlers } from "./ipc-receiver";

export * from "./env";



const storedLang = store.get("language");

app.whenReady().then(() => {
	registerIpcHandlers();
	registerExternalIpcHandlers();
	const win = createWindow();

	const systemLocale = storedLang ?? app.getLocale();
	setApplicationMenu(systemLocale, win);
	connectToEngine(win);
});
