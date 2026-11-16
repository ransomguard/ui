import { app } from "electron";

import { language } from "~/store";
import { initDatabase } from "~/db";

import { createWindow } from "./window";
import { setApplicationMenu } from "./menu";
import { createTray } from "./tray";
import { registerIpcHandlers } from "./ipc";
import { registerExternalIpcHandlers } from "./ipc-receiver";
import { initAutoUpdater } from "./updater";

export * from "./env";



app.whenReady().then(() => {
	const systemLocale = language.get();

	initDatabase();
	registerIpcHandlers();
	registerExternalIpcHandlers();
	setApplicationMenu(systemLocale);

	createWindow();
	createTray(systemLocale);
	initAutoUpdater();
});
