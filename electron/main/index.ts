import { app } from "electron";

export * from "./env";
import { createWindow } from "./window";
import { setApplicationMenu } from "./menu";



app.whenReady().then(() => {
	const win = createWindow();

	const systemLocale = app.getLocale();
	setApplicationMenu(systemLocale, win);
});
