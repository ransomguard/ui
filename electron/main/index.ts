import { app } from "electron";

import { store } from "~/store";

export * from "./env";
import { createWindow } from "./window";
import { setApplicationMenu } from "./menu";
import { connectToEngine } from "./engine";
import { registerIpcHandlers } from "./ipc";



const storedLang = store.get("language");

app.whenReady().then(() => {
	registerIpcHandlers();
	const win = createWindow();

	const systemLocale = storedLang ?? app.getLocale();
	setApplicationMenu(systemLocale, win);
	connectToEngine(win);
});
