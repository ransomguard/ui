import os from "node:os";
import url from "node:url";
import path from "node:path";
import { createRequire } from "node:module";
import type { BrowserWindowConstructorOptions } from "electron";

import { store, WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT } from "~/store";



export const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const require = createRequire(import.meta.url);

export const DB_FILE_NAME = "db.sqlite";
export const SECURITY_LOG_RETENTION_DAYS = 30;
export const SYSTEM_ERROR_RETENTION_DAYS = 7;



const windowState = store.get("windowState");
export const windowOptions: BrowserWindowConstructorOptions = {
	width: windowState?.width ?? 1200,
	height: windowState?.height ?? 800,
	...(windowState?.x !== undefined && { x: windowState.x }),
	...(windowState?.y !== undefined && { y: windowState.y }),
	minWidth: WINDOW_MIN_WIDTH,
	minHeight: WINDOW_MIN_HEIGHT,
};



export const ENGINE_BASE_NAME = "Ransom0Engine";
export const PIPE_NAME = (
	process.platform === "win32"
		? `\\\\.\\pipe\\${ENGINE_BASE_NAME}`
		: path.join(os.tmpdir(), `${ENGINE_BASE_NAME}.sock`)
);
