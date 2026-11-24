import { test, expect } from "bun:test";
import { Database } from "bun:sqlite";
import { ensureMemoryAggregation, telemetryByDay, telemetryByBucket, invalidateTelemetrySummary } from "../electron/services/telemetry-summary";

test("incremental chart equals SQL after late arrivals, moving edges and retention", () => {
	const db = new Database(":memory:");
	try {
		db.exec("CREATE TABLE security_logs(type TEXT, timestamp INTEGER, data TEXT)");
		const insert = db.prepare("INSERT INTO security_logs VALUES(?, ?, '')");
		const compare = (since: number) => {
			const expected = db.prepare(`SELECT CAST(timestamp/100 AS INTEGER) AS bucket, COUNT(*) AS telemetry,
 SUM(type='PROCESS_CREATE') AS processCreate, SUM(type='FILE_WRITE') AS fileWrite, SUM(type='FILE_RENAME') AS fileRename
 FROM security_logs WHERE timestamp>=? AND type IN ('PROCESS_CREATE','PROCESS_TERMINATE','FILE_WRITE','FILE_RENAME') GROUP BY bucket ORDER BY bucket`).all(since);
			expect(telemetryByBucket(db, since, 0, 100)).toEqual(expected as never);
		};
		for (let i = 0; i < 1000; i++) insert.run("FILE_WRITE", i);
		compare(5); compare(12);
		insert.run("FILE_RENAME", 15); insert.run("PROCESS_CREATE", 333); insert.run("ALERT", 1001);
		compare(13); compare(101); compare(0);
		db.exec("DELETE FROM security_logs WHERE timestamp<200");
		invalidateTelemetrySummary(db);
		compare(0); compare(222);
	} finally { db.close(); }
});

test("120,000 records aggregate without decoding payloads or counting normal exits as responses", () => {
	const db = new Database(":memory:");
	try {
		db.exec("CREATE TABLE security_logs(type TEXT, timestamp INTEGER, data TEXT)");
		const insert = db.prepare("INSERT INTO security_logs VALUES (?, ?, ?)");
		const types = ["PROCESS_CREATE", "PROCESS_TERMINATE", "FILE_WRITE", "FILE_RENAME"];
		db.transaction(() => {
			for (let i = 0; i < 120000; i++) insert.run(types[i % 4]!, 1800000000000 + i, "intentionally not decoded");
			insert.run("ALERT", 1800000000001, "handled by independent outcome decoder");
		})();
		const rows = telemetryByBucket(db, 1800000000000, 1800000000000, 60000);
		expect(rows).toEqual([0, 1].map(bucket => ({ bucket, telemetry: 60000, processCreate: 15000, fileWrite: 15000, fileRename: 15000 })));
		const daily = telemetryByDay(db);
		expect(daily.reduce((sum, row) => sum + row.telemetry, 0)).toBe(120000);
		expect(daily.reduce((sum, row) => sum + row.processCreate, 0)).toBe(30000);
		const boundary = telemetryByBucket(db, 1800000119999, 1800000060000, 60000);
		expect(boundary).toEqual([{ bucket: 0, telemetry: 1, processCreate: 0, fileWrite: 0, fileRename: 1 }]);
	} finally { db.close(); }
});

test("aggregation prevents disk-temp feedback and does not reset live temporary tables", () => {
	const db = new Database(":memory:");
	try {
		db.exec("PRAGMA temp_store = FILE");
		ensureMemoryAggregation(db);
		expect(db.prepare("PRAGMA temp_store").get()).toEqual({ temp_store: 2 });
		db.exec("CREATE TEMP TABLE marker(value INTEGER); INSERT INTO marker VALUES(42)");
		ensureMemoryAggregation(db);
		expect(db.prepare("SELECT value FROM marker").get()).toEqual({ value: 42 });
	} finally { db.close(); }
});

test("a SQLite build that forces disk spill is rejected before aggregation", () => {
	const db = { prepare: () => ({ all: () => [{ compile_options: "TEMP_STORE=0" }] }), exec: () => { throw new Error("must not execute"); } };
	expect(() => ensureMemoryAggregation(db)).toThrow("forces disk-backed");
});

test("chart boundaries reject unsafe ranges", () => {
	const db = new Database(":memory:");
	try {
		expect(() => telemetryByBucket(db, 10, 0, 0)).toThrow();
		expect(() => telemetryByBucket(db, 10, 11, 1)).toThrow();
	} finally { db.close(); }
});
