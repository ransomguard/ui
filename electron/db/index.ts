import path from "node:path";
import { app } from "electron";
import { lt } from "drizzle-orm";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type BetterSqlite3 from "better-sqlite3";

import {
	DB_FILE_NAME,
	SECURITY_LOG_RETENTION_DAYS,
	SYSTEM_ERROR_RETENTION_DAYS,
	require,
} from "~/config";

import * as table from "./schema";

const Database = require("better-sqlite3") as typeof BetterSqlite3;



export { table };
export type { BetterSQLite3Database };
export type Table = typeof table;
export type Insert<T extends keyof Table> = Table[T] extends { $inferInsert: infer I } ? I : never;
export type Select<T extends keyof Table> = Table[T] extends { $inferSelect: infer S } ? S : never;



let sqlite: BetterSqlite3.Database | null = null;
let db: BetterSQLite3Database | null = null;
export const safeGetDB = () => {
	return db;
};
export const getDB = () => {
	const db = safeGetDB();
	if (!db) {
		throw new Error("Database is not initialized. Call initDatabase() first.");
	}
	return db;
};

/**
 * Initializes the SQLite database file and Drizzle ORM instance.
 * Auto-creates security_logs table and indexes if not exists.
 */
export function initDatabase() {
	if (db) return db;

	if (!sqlite) {
		const dbPath = app.isPackaged
			? path.join(app.getPath("userData"), DB_FILE_NAME)
			: path.join(app.getAppPath(), DB_FILE_NAME);
		sqlite = new Database(dbPath);
	}

	db = drizzle({
		client: sqlite,
		casing: "snake_case",
	});

	const migrationsFolder = app.isPackaged
		? path.join(process.resourcesPath, "migrations")
		: path.join(app.getAppPath(), "electron", "db", "migrations");

	migrate(db, { migrationsFolder });
}

/**
 * 오래된 에러 로그 삭제
 * - 30일 이상된 security_logs 테이블의 로그 삭제
 * - 7일 이상된 system_errors 테이블의 로그 삭제
 * - 삭제된 행 수를 콘솔에 출력
 * - 에러 발생 시 콘솔에 에러 메시지 출력
 */
export async function cleanupLogs(db: BetterSQLite3Database) {
	const NOW = Date.now();
	const DAY_IN_MS = 24 * 60 * 60 * 1000;

	const securityRetentionTime = NOW - (SECURITY_LOG_RETENTION_DAYS * DAY_IN_MS);
	const errorRetentionTime = NOW - (SYSTEM_ERROR_RETENTION_DAYS * DAY_IN_MS);

	await deleteOldLogs(db, table.securityLogs, securityRetentionTime);
	await deleteOldLogs(db, table.systemErrors, errorRetentionTime);
}

async function deleteOldLogs(
	db: BetterSQLite3Database,
	table: Table["securityLogs"] | Table["systemErrors"],
	timestamp: number,
) {
	try {
		const deletedIds = await db.delete(table)
			.where(lt(table.timestamp, timestamp))
			.returning({ id: table.id });
		console.info(`[DB Cleanup] Removed ${deletedIds.length} old logs in ${table._.name}.`);
	} catch (error) {
		console.error(`[DB Cleanup] table: ${table._.name}: Failed to delete old logs:`, error);
	}
}
