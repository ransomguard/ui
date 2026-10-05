import { app } from "electron";

import { externalIPCReceiver, isValidIPCMessage } from "~/services/ipc-receiver";

import { getWindow } from "~/main/window";
import {
	table,
	getDB,
	type Insert,
} from "~/db";



app.on("before-quit", () => {
	externalIPCReceiver.stopAll();
});

export function registerExternalIpcHandlers() {
	const db = getDB();

	externalIPCReceiver.startListening();
	externalIPCReceiver.startConsumer(async batch => {
		const validIMessages: IncomingIPCMessage[] = [];
		const validItems: Insert<"securityLogs">[] = [];
		const invalidItems: Insert<"systemErrors">[] = [];
		for (const item of batch) {
			if (isValidIPCMessage(item)) {
				validIMessages.push(item);
				validItems.push({
					type: item.type,
					sequenceNumber: item.sequenceNumber,
					timestamp: item.timestamp,
					data: item,
				});

				if (item.type === "PROCESS_BLOCKED") {
					// FirewallTool을 앱으로 전환 및 named pipe를 통해 차단 요청
				}
			} else {
				invalidItems.push({
					source: "IPC_RECEIVER",
					timestamp: Date.now(),
					data: JSON.stringify(item),
					reason: "Invalid IPC message format",
				});
			}
		}

		getWindow()?.webContents.send("security-logs-updated", validIMessages);

		try {
			if (validItems.length > 0) {
				await db.insert(table.securityLogs).values(validItems);
			}
		} catch (error) {
			console.error("[IPC] Database bulk insert failed:", error);
		}

		try {
			if (invalidItems.length > 0) {
				await db.insert(table.systemErrors).values(invalidItems);
				console.warn(`[IPC] Saved ${invalidItems.length} invalid packets to system_errors.`);
			}
		} catch (error) {
			console.error("[IPC] Database bulk insert failed:", error);
		}
	});
}
