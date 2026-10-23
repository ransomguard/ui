import { app, BrowserWindow } from "electron";
import path from "node:path";

import { __dirname, windowOptions } from "~/config";
import { store } from "~/store";

import { VITE_DEV_SERVER_URL, RENDERER_DIST } from "./env";



/**
 * - 현재 열려있는 BrowserWindow를 반환하거나, 없으면 새로 생성하여 반환
 */
export function getWindow() {
	const windows = BrowserWindow.getAllWindows().filter(win => !win.isDestroyed());
	if (windows.length) {
		return windows[0]!;
	}
    return createWindow();
}

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
	window.on("close", saveState);

	// 이전 실행 시 최대화 상태였다면 앱 열 때 최대화 상태 적용
	if (store.get("windowState.isMaximized")) {
		window.maximize();
	}
}



export function createWindow() {
	const win = new BrowserWindow({
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
	// tray를 사용하기 때문에 앱을 직접 종료하기 전까지는 창을 닫아도 종료되지 않도록 함
	// if (process.platform !== "darwin") {
	// 	app.quit();
	// }
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
