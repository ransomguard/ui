import net from "node:net";

import { getPipeName } from "~/config";



export * from "./types";
export { isValidIPCMessage } from "./guard";



const MAX_BATCH_SIZE = 500;
const MAX_DELIVERY_ITEMS = 64;
const INTERVAL_MS = 500; // Queue consumer interval in milliseconds

export const PIPE_NAME = getPipeName("Ransom0_UI");



export class ExternalIPCReceiver {
	#server: net.Server | null = null;
	#queue: { line: string; socket: net.Socket }[] = [];
	#sockets = new Set<net.Socket>();
	#consumerInterval: NodeJS.Timeout | null = null;
	#isProcessing = false;

	startListening(pipeName = PIPE_NAME) {
		if (this.#server) return;

		this.#server = net.createServer((socket) => {
			console.log("[IPC] Connection established with external app.");

			this.#sockets.add(socket);
			socket.on("close", () => this.#sockets.delete(socket));
			let buffer = "";
			// Preserve UTF-8 characters split across pipe reads (e.g. Korean paths).
			socket.setEncoding("utf8");
			socket.on("data", (chunk) => {
				buffer += chunk;

				let startIndex = 0;
				let newlineIndex;
				while ((newlineIndex = buffer.indexOf("\n", startIndex)) !== -1) {
					const line = buffer.slice(startIndex, newlineIndex).trim();
					if (line !== "") {
						if (line.length > 65536 || this.#queue.length >= 10000) { socket.destroy(); return; }
						this.#queue.push({ line, socket });
					}
					startIndex = newlineIndex + 1;
				}

				if (startIndex > 0) {
					// 줄바꿈이 없으면 데이터가 완성되지 않았다는 의미 -> 남은 문자열은 다음 데이터와 함께 처리
					buffer = buffer.slice(startIndex);
				}
				if (buffer.length > 65536) socket.destroy();
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

		this.#server.listen(pipeName, () => {
			console.log(`[IPC Server] Listening on: ${pipeName}`);
		});
	}

	startConsumer(onBatchProcess: (batch: unknown[], ids: (string | undefined)[]) => unknown, intervalMs = INTERVAL_MS) {
		if (this.#consumerInterval) return;

		this.#consumerInterval = setInterval(async () => {
			if (this.#isProcessing || this.#queue.length === 0) return;
			this.#isProcessing = true;

			try {
				const batch: unknown[] = [];
				const ids: (string | undefined)[] = [];
				const destinations = new Map<net.Socket, string[]>();
				const lines = this.#queue.splice(0, MAX_BATCH_SIZE);
				for (const { line, socket } of lines) {
					try {
						const frame = JSON.parse(line);
						if (frame?.deliveryVersion === 1) {
							if (!Array.isArray(frame.items) || frame.items.length > MAX_DELIVERY_ITEMS || !frame.items.every((item: { id?: unknown; message?: unknown }) => typeof item?.id === "string" && /^[a-zA-Z0-9-]{1,64}$/.test(item.id) && item.message)) throw new Error("Invalid delivery envelope");
							for (const item of frame.items) {
								batch.push(item.message); ids.push(item.id);
								const list = destinations.get(socket) ?? []; list.push(item.id); destinations.set(socket, list);
							}
						} else { batch.push(frame); ids.push(undefined); }
					} catch (error) {
						console.error("[IPC] Failed to parse JSON:", error);
					}
				}

				if (batch.length > 0) {
					const result = await onBatchProcess(batch, ids);
					if (Array.isArray(result)) {
						const committed = new Set(result);
						for (const [socket, requested] of destinations) {
							const ack = requested.filter(id => committed.has(id));
							if (!socket.destroyed && socket.writable && ack.length) socket.write(JSON.stringify({ deliveryVersion: 1, ack, maxBatchItems: MAX_DELIVERY_ITEMS }) + "\n");
						}
					}
				}
			} catch (error) {
				console.error("[IPC] Error processing batch:", error);
			} finally {
				this.#isProcessing = false;
			}
		}, intervalMs);
	}

	stopAll() {
		for (const socket of this.#sockets) socket.destroy();
		this.#queue = [];
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

