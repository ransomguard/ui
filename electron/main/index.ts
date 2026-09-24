import { app } from "electron";

export * from "./env";
import { createWindow } from "./window";



app.whenReady().then(() => {
	createWindow();
});
