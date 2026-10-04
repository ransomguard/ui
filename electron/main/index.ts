import { app } from "electron";

import { store } from "~/store";

import { createWindow } from "./window";
import { setApplicationMenu } from "./menu";
import { registerIpcHandlers } from "./ipc";

export * from "./env";



const storedLang = store.get("language");

app.whenReady().then(() => {
	const systemLocale = storedLang ?? app.getLocale();

	registerIpcHandlers();
	setApplicationMenu(systemLocale);

	createWindow();
});
