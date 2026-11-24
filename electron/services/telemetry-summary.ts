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

type BucketCache = { origin: number; width: number; lastRow: number; version: number; rows: Map<number, TelemetrySummary> };
const bucketCaches = new WeakMap<Reader, BucketCache>();
export function invalidateTelemetrySummary(db: Reader): void { bucketCaches.delete(db); }

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
	// Cache only aggregates, never payloads. Committed new rows (including late
	// timestamps) are folded in by rowid. The moving partial first bucket is
	// queried exactly so a sliding time range never counts expired events.
	const version = (db.prepare("PRAGMA data_version").all()[0] as { data_version: number }).data_version;
	const lastRow = Number((db.prepare("SELECT COALESCE(MAX(rowid),0) AS n FROM security_logs").all()[0] as { n: number }).n);
	let cache = bucketCaches.get(db);
	if (!cache || cache.origin !== origin || cache.width !== width || cache.version !== version || cache.lastRow > lastRow) {
		cache = { origin, width, lastRow: 0, version, rows: new Map() };
	}
	const additions = db.prepare(`SELECT CAST((timestamp - ?)/? AS INTEGER) AS bucket, ${counts}
 FROM security_logs NOT INDEXED WHERE rowid > ? AND rowid <= ? AND timestamp >= ? AND ${types} GROUP BY bucket`).all(origin, width, cache.lastRow, lastRow, origin) as TelemetrySummary[];
	for (const row of additions) {
		const bucket = Number(row.bucket);
		const old = cache.rows.get(bucket);
		cache.rows.set(bucket, old ? { bucket, telemetry: old.telemetry + row.telemetry,
			processCreate: old.processCreate + row.processCreate, fileWrite: old.fileWrite + row.fileWrite,
			fileRename: old.fileRename + row.fileRename } : { ...row, bucket });
	}
	cache.lastRow = lastRow;
	if (cache.rows.size <= 4096) bucketCaches.set(db, cache);
	else bucketCaches.delete(db);
	const first = Math.floor((since - origin) / width);
	const rows = Array.from(cache.rows.values()).filter(row => Number(row.bucket) >= first).map(row => ({ ...row }));
	if (since !== origin + first * width) {
		const partial = db.prepare(`SELECT ? AS bucket, ${counts} FROM security_logs
 WHERE timestamp >= ? AND timestamp < ? AND rowid <= ? AND ${types} HAVING COUNT(*) > 0`).all(first, since, origin + (first + 1) * width, lastRow) as TelemetrySummary[];
		const at = rows.findIndex(row => Number(row.bucket) === first);
		if (at >= 0) rows.splice(at, 1);
		rows.push(...partial);
	}
	return rows.sort((a, b) => Number(a.bucket) - Number(b.bucket));
}
