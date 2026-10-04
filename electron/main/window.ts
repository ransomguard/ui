import { app, BrowserWindow } from "electron";
import path from "node:path";

import { __dirname, windowOptions } from "~/config";
import { store } from "~/store";

import { VITE_DEV_SERVER_URL, RENDERER_DIST } from "./env";



let win: BrowserWindow | null;

function setupWindowStateListener(window: BrowserWindow) {
	const saveState = () => {
		if (window.isDestroyed()) return;

		const isMaximized = window.isMaximized();
		const isMinimized = window.isMinimized();

		if (!isMaximized && !isMinimized) {
			const bounds = window.getBounds();
			store.set("windowState", {
				width: bounds.width,
				height: bounds.height,
				x: bounds.x,
				y: bounds.y,
				isMaximized: false,
			});
		} else if (isMaximized) {
			store.set("windowState.isMaximized", true);
		}
	};

	let timeoutId: NodeJS.Timeout;
	const debouncedSave = () => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(saveState, 200);
	};

	window.on("resize", debouncedSave);
	window.on("move", debouncedSave);
	window.on("maximize", saveState);
	window.on("unmaximize", saveState);

	// 이전 실행 시 최대화 상태였다면 앱 열 때 최대화 상태 적용
	if (store.get("windowState.isMaximized")) {
		window.maximize();
	}
}



export function createWindow() {
	win = new BrowserWindow({
		icon: path.join(process.env.VITE_PUBLIC, "logo.png"),
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			contextIsolation: true,
		},

		...windowOptions,
	});

	setupWindowStateListener(win);

	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
	} else {
		// win.loadFile("dist/index.html");
		win.loadFile(path.join(RENDERER_DIST, "index.html"));
	}

	return win;
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
		win = null;
	}
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
