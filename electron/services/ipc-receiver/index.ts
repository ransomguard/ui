import net from "node:net";

import { getPipeName } from "~/config";



export * from "./types";
export { isValidIPCMessage } from "./guard";



const MAX_BATCH_SIZE = 500;
const MAX_DELIVERY_ITEMS = 64;

export const PIPE_NAME = getPipeName("Ransom0_UI");



export class ExternalIPCReceiver {
	#server: net.Server | null = null;
	#queue: { line: string; socket: net.Socket }[] = [];
	#sockets = new Set<net.Socket>();
	#consumer: (() => Promise<void>) | null = null;
	#scheduled: NodeJS.Immediate | null = null;
	#isProcessing = false;
	#listenRetry: NodeJS.Timeout | null = null;

	#schedule() {
		if (!this.#consumer || this.#scheduled || this.#isProcessing || !this.#queue.length) return;
		this.#scheduled = setImmediate(() => {
			this.#scheduled = null;
			void this.#consumer?.();
		});
	}

	startListening(pipeName = PIPE_NAME) {
		if (this.#server) return;
		if (this.#listenRetry) { clearTimeout(this.#listenRetry); this.#listenRetry = null; }

		this.#server = net.createServer((socket) => {

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
				this.#schedule();
			});


			socket.on("error", (err) => {
				console.error("[IPC] Socket error:", err);
			});
		});

		this.#server.on("error", (err) => {
			console.error("[IPC Server] Failed to start server:", err);
			// A just-closed dashboard can briefly retain the named-pipe endpoint.
			// Keep durable delivery pending and retry binding instead of staying
			// disconnected for the entire lifetime of the replacement dashboard.
			if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
				const failed = this.#server;
				this.#server = null;
				failed?.close(() => {});
				this.#listenRetry = setTimeout(() => {
					this.#listenRetry = null;
					this.startListening(pipeName);
				}, 1000);
			}
		});

		this.#server.listen(pipeName, () => {
			console.log(`[IPC Server] Listening on: ${pipeName}`);
		});
	}

	startConsumer(onBatchProcess: (batch: unknown[], ids: (string | undefined)[]) => unknown, _legacyIntervalMs?: number) {
		void _legacyIntervalMs; // Compatibility only; new events never wait for a timer.
		if (this.#consumer) return;

		this.#consumer = async () => {
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
				this.#schedule();
			}
		};
		this.#schedule();
	}

	stopAll() {
		if (this.#listenRetry) { clearTimeout(this.#listenRetry); this.#listenRetry = null; }
		for (const socket of this.#sockets) socket.destroy();
		this.#queue = [];
		if (this.#server) {
			this.#server.close();
			this.#server = null;
		}
		this.#consumer = null;
		if (this.#scheduled) {
			clearImmediate(this.#scheduled);
			this.#scheduled = null;
		}
	}
}



export const externalIPCReceiver = new ExternalIPCReceiver();

