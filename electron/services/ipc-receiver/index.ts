import os from "node:os";
import net from "node:net";



export * from "./types";
export { isValidIPCMessage } from "./guard";



const MAX_BATCH_SIZE = 500;
const INTERVAL_MS = 500; // Queue consumer interval in milliseconds

const PIPE_NAME = (
	process.platform === "win32"
		? "\\\\.\\pipe\\Ransom0UI"
		: `${os.tmpdir()}/Ransom0UI.sock` // for development on non-Windows platforms
);



class ExternalIPCReceiver {
	#server: net.Server | null = null;
	#queue: string[] = [];
	#consumerInterval: NodeJS.Timeout | null = null;
	#isProcessing = false;

	startListening() {
		if (this.#server) return;

		this.#server = net.createServer((socket) => {
			console.log("[IPC] Connection established with external app.");

			let buffer = "";
			socket.on("data", (chunk) => {
				buffer += chunk.toString("utf-8");

				let startIndex = 0;
				let newlineIndex;
				while ((newlineIndex = buffer.indexOf("\n", startIndex)) !== -1) {
					const line = buffer.slice(startIndex, newlineIndex).trim();
					if (line !== "") {
						this.#queue.push(line);
					}
					startIndex = newlineIndex + 1;
				}

				if (startIndex > 0) {
					// 줄바꿈이 없으면 데이터가 완성되지 않았다는 의미 -> 남은 문자열은 다음 데이터와 함께 처리
					buffer = buffer.slice(startIndex);
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

	startConsumer(onBatchProcess: (batch: unknown[]) => unknown, intervalMs = INTERVAL_MS) {
		if (this.#consumerInterval) return;

		this.#consumerInterval = setInterval(async () => {
			if (this.#isProcessing || this.#queue.length === 0) return;
			this.#isProcessing = true;

			try {
				const batch = [];
				const lines = this.#queue.splice(0, MAX_BATCH_SIZE);
				for (const line of lines) {
					try {
						batch.push(JSON.parse(line));
					} catch (error) {
						console.error("[IPC] Failed to parse JSON:", error);
					}
				}

				if (batch.length > 0) {
					await onBatchProcess(batch);
				}
			} catch (error) {
				console.error("[IPC] Error processing batch:", error);
			} finally {
				this.#isProcessing = false;
			}
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
