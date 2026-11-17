// Aggregate high-volume telemetry in SQLite. Never materialize its JSON bodies
// just to count events; verified response outcomes keep their separate decoder.
interface Reader {
	prepare(sql: string): { all(...args: number[]): unknown[] };
	exec(sql: string): unknown;
}
export interface TelemetrySummary {
	bucket: number | string;
	telemetry: number;
	processCreate: number;
	fileWrite: number;
	fileRename: number;
}
const counts = `COUNT(*) AS telemetry,
 SUM(type = 'PROCESS_CREATE') AS processCreate,
 SUM(type = 'FILE_WRITE') AS fileWrite,
 SUM(type = 'FILE_RENAME') AS fileRename`;
const types = "type IN ('PROCESS_CREATE','PROCESS_TERMINATE','FILE_WRITE','FILE_RENAME')";

export function ensureMemoryAggregation(db: Reader): void {
	const options = db.prepare("PRAGMA compile_options").all() as { compile_options: string }[];
	if (options.some(row => row.compile_options === "TEMP_STORE=0")) throw new Error("SQLite forces disk-backed temporary storage; aggregation disabled");
	const current = db.prepare("PRAGMA temp_store").all() as { temp_store: number }[];
	if (current[0]?.temp_store === 2) return;
	// Disk sort spill creates etilqs_* writes that the kernel must observe. Use
	// connection-local RAM storage instead of excluding those paths from detection.
	db.exec("PRAGMA temp_store = MEMORY");
	const checked = db.prepare("PRAGMA temp_store").all() as { temp_store: number }[];
	if (checked[0]?.temp_store !== 2) throw new Error("In-memory aggregation could not be enabled");
}

export function telemetryByDay(db: Reader): TelemetrySummary[] {
	ensureMemoryAggregation(db);
	return db.prepare(`SELECT strftime('%Y-%m-%d', timestamp/1000, 'unixepoch', 'localtime') AS bucket, ${counts}
 FROM security_logs WHERE ${types} GROUP BY bucket`).all() as TelemetrySummary[];
}

export function telemetryByBucket(db: Reader, since: number, origin: number, width: number): TelemetrySummary[] {
	if (![since, origin, width].every(Number.isSafeInteger) || width <= 0 || origin > since) throw new Error("Invalid chart bucket");
	ensureMemoryAggregation(db);
	return db.prepare(`SELECT CAST((timestamp - ?)/? AS INTEGER) AS bucket, ${counts}
 FROM security_logs WHERE timestamp >= ? AND ${types} GROUP BY bucket`).all(origin, width, since) as TelemetrySummary[];
}
