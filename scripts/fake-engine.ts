import net from "node:net";
import fs from "node:fs";

import { PIPE_NAME } from "../config";



export function startFakeEngine() {
	console.log("[Ransom0UI] Starting Fake Engine...");

	if (process.platform !== "win32" && fs.existsSync(PIPE_NAME)) {
		fs.unlinkSync(PIPE_NAME);
	}

	const server = net.createServer((socket) => {
		console.log("[Ransom0UI] UI App(Electron) connected to Fake Engine!");

		socket.on("end", () => {
			console.log("[Ransom0UI] UI App(Electron) disconnected.");
		});
	});



	server.listen(PIPE_NAME, () => {
		console.log(`[Ransom0UI] Fake Engine is running on: ${PIPE_NAME}`);
	});
}



startFakeEngine();
