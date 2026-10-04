import os from "node:os";
import net from "node:net";



export type * from "./types";
export { isValidIPCMessage } from "./guard";



const INTERVAL_MS = 500; // Queue consumer interval in milliseconds

const PIPE_NAME = (
	process.platform === "win32"
		? "\\\\.\\pipe\\Ransom0UI"
		: `${os.tmpdir()}/Ransom0UI.sock` // for development on non-Windows platforms
);



class ExternalIPCReceiver {
	#server: net.Server | null = null;
	#queue: unknown[] = [];
	#consumerInterval: NodeJS.Timeout | null = null;

	startListening() {
		if (this.#server) return;

		this.#server = net.createServer((socket) => {
			console.log("[IPC] Connection established with external app.");

			let buffer = "";
			socket.on("data", (chunk) => {
				buffer += chunk.toString("utf-8");

				let newlineIndex;
				while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
					const line = buffer.slice(0, newlineIndex).trim();
					buffer = buffer.slice(newlineIndex + 1);

					if (line !== "") {
						try {
							const jsonData = JSON.parse(line);
							this.#queue.push(jsonData);
						} catch (error) {
							console.error("[IPC] Failed to parse JSON:", error);
						}
					}
				}
			});

			socket.on("end", () => {
				console.log("[IPC] Connection closed by external app.");
			});

			socket.on("error", (err) => {
				console.error("[IPC] Socket error:", err);
			});
		});

		this.#server.on("error", (err) => {
			console.error("[IPC Server] Failed to start server:", err);
		});

		this.#server.listen(PIPE_NAME, () => {
			console.log(`[IPC Server] Listening on: ${PIPE_NAME}`);
		});
	}

	startConsumer(onBatchProcess: (batch: unknown[]) => void, intervalMs = INTERVAL_MS) {
		if (this.#consumerInterval) return;

		this.#consumerInterval = setInterval(() => {
			if (this.#queue.length === 0) return;

			// 쌓인 데이터를 한 번에 통째로 꺼냄 (배치 처리)
			const batch = this.#queue.splice(0, this.#queue.length);
			onBatchProcess(batch);

		}, intervalMs);
	}

	stopAll() {
		if (this.#server) {
			this.#server.close();
			this.#server = null;
		}
		if (this.#consumerInterval) {
			clearInterval(this.#consumerInterval);
			this.#consumerInterval = null;
		}
	}
}



export const externalIPCReceiver = new ExternalIPCReceiver();
