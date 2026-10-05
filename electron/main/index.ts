import { app } from "electron";

import { store } from "~/store";
import { initDatabase } from "~/db";

import { createWindow } from "./window";
import { setApplicationMenu } from "./menu";
import { registerIpcHandlers } from "./ipc";
import { registerExternalIpcHandlers } from "./ipc-receiver";

export * from "./env";



const storedLang = store.get("language");

app.whenReady().then(() => {
	const systemLocale = storedLang ?? app.getLocale();

	initDatabase();
	registerIpcHandlers();
	registerExternalIpcHandlers();
	setApplicationMenu(systemLocale);

	createWindow();
});
