import url from "node:url";
import path from "node:path";
import type { BrowserWindowConstructorOptions } from "electron";



export const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const windowOptions: BrowserWindowConstructorOptions = {
	width: 1200,
	height: 800,
	minWidth: 800,
	minHeight: 600,
};
