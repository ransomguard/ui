import net from "node:net";
import type { BrowserWindow } from "electron";

import { PIPE_NAME } from "../config";



const RECONNECT_INTERVAL = 3000;

let isEngineConnected = false;
export function connectToEngine(win: BrowserWindow) {
	let reconnectTimer: NodeJS.Timeout;

	win.webContents.on("did-finish-load", () => {
		win.webContents.send("engine-status-changed", isEngineConnected);
	});

	const connect = () => {
		const client = net.createConnection(PIPE_NAME);

		client.on("connect", () => {
			console.log("[Ransom0UI] Engine is connected successfully.");
			isEngineConnected = true;

			if (!win.isDestroyed()) {
				win.webContents.send("engine-status-changed", true);
			}
		});

		client.on("error", () => {
			isEngineConnected = false;

			if (!win.isDestroyed()) {
				win.webContents.send("engine-status-changed", false);
			}
			clearTimeout(reconnectTimer);
			reconnectTimer = setTimeout(connect, RECONNECT_INTERVAL);
		});

		client.on("end", () => {
			console.log("[Ransom0UI] Engine is disconnected.");
			isEngineConnected = false;

			if (!win.isDestroyed()) {
				win.webContents.send("engine-status-changed", false);
			}
			clearTimeout(reconnectTimer);
			reconnectTimer = setTimeout(connect, RECONNECT_INTERVAL);
		});

		return client;
	};

	return connect();
}
