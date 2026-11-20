import { app } from "electron";

import { externalIPCReceiver, isValidIPCMessage } from "~/services/ipc-receiver";
// import { sendToFirewallTool } from "~/services/firewall-tool";

import { findWindow } from "./window";
import {
	table,
	getRawDB,
	getDB,
	type Insert,
} from "~/db";

import { checkUnreadThreats, fetchSecurityLogs, getDashboardStatsAndCounts } from "./queries";
import { createReceiptWriter } from "~/services/ipc-receiver/receipts";
import { notifyImportantEvents } from "./tray";



let lastEngineStatus: ExtractIncomingIPCMessage<"SYSTEM_STATUS"> | undefined = undefined;
export type GetLastEngineStatusData = Awaited<ReturnType<typeof getLastEngineStatus>>;
export const getLastEngineStatus = async () => {
	const [hasUnreadThreats, alertLogs, telemetryLogs, statsAndCounts] = await Promise.all([
		checkUnreadThreats(),
		fetchSecurityLogs({
			types: ["PROCESS_BLOCKED", "VSS_ATTEMPT", "ALERT", "VSS_STATUS"],
			limit: 10,
		}),
		fetchSecurityLogs({
			types: ["PROCESS_CREATE", "PROCESS_TERMINATE", "FILE_WRITE", "FILE_RENAME"],
			limit: 10,
		}),
		getDashboardStatsAndCounts(90),
	]);

	return {
		lastEngineStatus,
		hasUnreadThreats,
		recentSecurityLogs: [...alertLogs, ...telemetryLogs],
		dailyStats: statsAndCounts.dailyStats,
		totalCounts: statsAndCounts.totalCounts,
	};
};

app.on("before-quit", () => {
	externalIPCReceiver.stopAll();
});

export function registerExternalIpcHandlers() {
	const db = getDB();

	const persist = createReceiptWriter(getRawDB());
	externalIPCReceiver.startListening();
	externalIPCReceiver.startConsumer(async (batch, ids) => {
		const valid: IncomingIPCMessage[] = [];
		const validIds: (string | undefined)[] = [];
		const invalid: Insert<"systemErrors">[] = [];
		batch.forEach((item, index) => {
			if (isValidIPCMessage(item)) { valid.push(item); validIds.push(ids[index]); }
			else invalid.push({ source: "IPC_RECEIVER", timestamp: Date.now(), data: JSON.stringify(item), reason: "Invalid IPC message format" });
		});
		// Never publish or acknowledge a log before its transaction commits.
		const { fresh, ack } = persist(valid, validIds);
		for (const item of fresh) if (item.type === "SYSTEM_STATUS") lastEngineStatus = item;
		if (fresh.length) {
			findWindow()?.webContents.send("security-logs-updated", fresh);
			notifyImportantEvents(fresh);
		}
		if (invalid.length) {
			try { await db.insert(table.systemErrors).values(invalid); }
			catch (error) { console.error("[IPC] Invalid packet logging failed:", error); }
		}
		return ack;
	});
}

