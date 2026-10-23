import { app } from "electron";

import { externalIPCReceiver, isValidIPCMessage } from "~/services/ipc-receiver";
// import { sendToFirewallTool } from "~/services/firewall-tool";

import { getWindow } from "~/main/window";
import {
	table,
	getDB,
	type Insert,
} from "~/db";

import { checkUnreadThreats, getRecentSecurityLogs } from "./queries";
import { notifyImportantEvents } from "./tray";



let lastEngineStatus: ExtractIncomingIPCMessage<"SYSTEM_STATUS"> | undefined = undefined;
export type GetLastEngineStatusData = Awaited<ReturnType<typeof getLastEngineStatus>>;
export const getLastEngineStatus = async () => ({
	lastEngineStatus,
	hasUnreadThreats: await checkUnreadThreats(),
	recentSecurityLogs: await getRecentSecurityLogs(100),
});

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
				if (item.type === "SYSTEM_STATUS") {
					lastEngineStatus = item;
				} else {
					validIMessages.push(item);
					validItems.push({
						type: item.type,
						sequenceNumber: item.sequenceNumber,
						timestamp: item.timestamp,
						data: item,
					});

					// 커널 v0.5.0 기준 미니필터 기반 차단이라 ip를 탐지하지 못함?
					// 네트워크 기반 차단 로직이 없음? 그럼 ip 차단 자동화는 어떻게?
					// if (item.type === "NETWORK_BLOCKED") {
					// 	await sendToFirewallTool("BLOCK_ADD", [
					// 	]);
					// }
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

		if (validIMessages.length > 0) {
			getWindow().webContents.send("security-logs-updated", validIMessages);
			notifyImportantEvents(validIMessages);
		}

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
