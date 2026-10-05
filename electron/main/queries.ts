import { isNull, and, inArray, desc } from "drizzle-orm";

import { getDB, table } from "~/db";



/**
 * 확인하지 않은 위협 존재 여부
 */
export async function checkUnreadThreats() {
	try {
		const db = getDB();
		const unreadExists = await db.select({ id: table.securityLogs.id })
			.from(table.securityLogs)
			.where(
				and(
					isNull(table.securityLogs.isViewedAt),
					inArray(table.securityLogs.type, [
						"ALERT",
						"PROCESS_BLOCKED",
						"VSS_ATTEMPT"
					])
				)
			)
			.limit(1);
		return unreadExists.length > 0;
	} catch (error) {
		console.error("[DB Error] Failed to check unread threats:", error);
		return false; 
	}
}

/**
 * 최근 보안 로그 조회 (초기 캐시 데이터 로드용)
 */
export async function getRecentSecurityLogs(limit = 100) {
	try {
		const db = getDB();
		const rows = await db.select()
			.from(table.securityLogs)
			.orderBy(desc(table.securityLogs.timestamp))
			.limit(limit);
		return rows.map((row) => row.data);
	} catch (error) {
		console.error("[DB Error] Failed to fetch recent security logs:", error);
		return [];
	}
}

/**
 * 최근 접근 제어 로그 조회 (초기 캐시 데이터 로드용)
 */
export async function getRecentAccessControlLogs(limit = 100) {
	try {
		const db = getDB();
		const rows = await db.select()
			.from(table.accessControlLogs)
			.orderBy(desc(table.accessControlLogs.performedAt))
			.limit(limit);
		return rows;
	} catch (error) {
		console.error("[DB Error] Failed to fetch recent access control logs:", error);
		return [];
	}
}
