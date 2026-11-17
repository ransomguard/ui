// Runs independently so mocks never replace the application DB in other tests.
import { mock } from "bun:test";
import assert from "node:assert/strict";
const now = Date.now();
const security = { timestamp: "timestamp", type: "type", data: "data" };
const access = { performedAt: "performedAt", ips: "ips" };
const message = (type: string, data: object, mode = "production") => ({
	type, timestamp: now, evidence: { mode, source: "response" }, data,
});
const forced = message("ALERT", { processId: 321, processGeneration: "133700000000000001", eventId: "verified", action: "BLOCKED", terminationConfirmed: true });
const recovery = message("VSS_STATUS", { action: "RESTORE_COMPLETED", eventId: "verified", recoveryVerified: true, recoveredFiles: ["C:\\records\\one", "c:\\RECORDS\\ONE"] });
const messages = [
	message("PROCESS_TERMINATE", { processId: 321 }),
	message("ALERT", forced.data, "test"),
	message("VSS_STATUS", recovery.data, "test"),
	forced, forced, recovery, recovery,
	message("VSS_STATUS", { action: "RESTORE_FAILED" }),
];
mock.module("../electron/db", () => ({
	table: { securityLogs: security, accessControlLogs: access },
	getDB: () => ({ select: () => ({ from: (table: unknown) => ({ where: () => Promise.resolve(table === security ? messages.map(data => ({ type: data.type, timestamp: now, data })) : []) }) }) }),
}));
mock.module("../electron/store", () => ({ acknowledgedThreat: { get: () => ({ lastId: 0, lastTime: 0 }) } }));
const { getDashboardChartStats } = await import("../electron/main/queries");
for (const [days, interval] of [[1, "15m"], [7, "1d"], [90, "1d"]] as const) {
	const rows = await getDashboardChartStats({ days, interval });
	assert.ok(rows.length >= days);
	assert.equal(rows.reduce((n, row) => n + row.processTerminated, 0), 1);
	assert.equal(rows.reduce((n, row) => n + row.recovery, 0), 1);
	assert.equal(rows.reduce((n, row) => n + row.threat, 0), 0);
	assert.equal(rows.at(-1)?.processTerminated, 1, "current partial bucket must include the latest event");
}
console.log("Chart regression PASS: normal/test/failed/duplicate outcomes excluded; verified outcomes and current 15m bucket retained.");
