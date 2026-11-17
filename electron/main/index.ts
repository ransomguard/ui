import { app } from "electron";

import { language } from "~/store";
import { initDatabase, getDB, cleanupLogs } from "~/db";

import { createWindow } from "./window";
import { setApplicationMenu } from "./menu";
import { createTray } from "./tray";
import { registerIpcHandlers } from "./ipc";
import { registerExternalIpcHandlers } from "./ipc-receiver";
import { initAutoUpdater } from "./updater";

export * from "./env";



app.whenReady().then(async () => {
	const systemLocale = language.get();

	initDatabase();
	await cleanupLogs(getDB());
	const cleanupTimer = setInterval(() => { void cleanupLogs(getDB()); }, 60 * 60 * 1000);
	cleanupTimer.unref();
	app.once("before-quit", () => clearInterval(cleanupTimer));
	registerIpcHandlers();
	registerExternalIpcHandlers();
	setApplicationMenu(systemLocale);

	createWindow();
	createTray(systemLocale);
	initAutoUpdater();
});
