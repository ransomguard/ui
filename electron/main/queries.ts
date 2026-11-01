import { and, inArray, gte, gt, lt, lte, desc, asc, sql } from "drizzle-orm";

import { acknowledgedThreat } from "~/store";
import { getDB, table } from "~/db";
import type { SecurityLogType } from "~/db/schema/security-logs";
import type { IncomingIPCMessage } from "~/services/ipc-receiver";



export interface FetchSecurityLogsOptions {
	types?: SecurityLogType[];
	beforeTimestamp?: number;
	afterTimestamp?: number;
	limit?: number;
	direction?: "older" | "newer";
}

/**
 * 확인하지 않은 위협 존재 여부
 */
export async function checkUnreadThreats() {
	try {
		const db = getDB();
		const { lastId, lastTime } = acknowledgedThreat.get();
		const conditions = [
			inArray(table.securityLogs.type, [
				"ALERT",
				"PROCESS_BLOCKED",
				"VSS_ATTEMPT",
			]),
		];

		if (lastId > 0) {
			conditions.push(gt(table.securityLogs.id, lastId));
		} else if (lastTime > 0) {
			conditions.push(gt(table.securityLogs.timestamp, lastTime));
		}

		const unreadExists = await db.select({ id: table.securityLogs.id })
			.from(table.securityLogs)
			.where(and(...conditions))
			.limit(1);
		return unreadExists.length > 0;
	} catch (error) {
		console.error("[DB Error] Failed to check unread threats:", error);
		return false;
	}
}

/**
 * 위협 확인 처리 (store에 마지막 확인한 위협 id 및 시각 기록)
 */
export async function acknowledgeThreats(timestamp?: number) {
	try {
		const db = getDB();
		const latestThreat = await db.select({
			id: table.securityLogs.id,
			timestamp: table.securityLogs.timestamp,
		})
			.from(table.securityLogs)
			.where(
				inArray(table.securityLogs.type, [
					"ALERT",
					"PROCESS_BLOCKED",
					"VSS_ATTEMPT",
				]),
			)
			.orderBy(desc(table.securityLogs.id))
			.limit(1);

		const maxId = latestThreat[0]?.id ?? 0;
		const maxTime = Math.max(latestThreat[0]?.timestamp ?? 0, timestamp ?? Date.now());
		acknowledgedThreat.set(maxId, maxTime);
		return true;
	} catch (error) {
		console.error("[Store Error] Failed to acknowledge threats:", error);
		return false;
	}
}

/**
 * 보안 로그 페이징/기간 조회 (무한 스크롤 및 차트 집계용)
 */
export async function fetchSecurityLogs(options?: FetchSecurityLogsOptions) {
	try {
		const db = getDB();
		const conditions = [];

		if (options?.types && options.types.length > 0) {
			conditions.push(inArray(table.securityLogs.type, options.types));
		}

		if (options?.direction === "newer") {
			if (options.afterTimestamp !== undefined) {
				conditions.push(gt(table.securityLogs.timestamp, options.afterTimestamp));
			}

			const query = db.select()
				.from(table.securityLogs)
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(asc(table.securityLogs.timestamp), asc(table.securityLogs.id));

			const rows = options?.limit !== undefined
				? await query.limit(options.limit)
				: await query;

			rows.reverse();
			return rows.map((row) => row.data);
		}

		if (options?.beforeTimestamp !== undefined) {
			conditions.push(lt(table.securityLogs.timestamp, options.beforeTimestamp));
		}
		if (options?.afterTimestamp !== undefined) {
			conditions.push(gte(table.securityLogs.timestamp, options.afterTimestamp));
		}

		const query = db.select()
			.from(table.securityLogs)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(table.securityLogs.timestamp), desc(table.securityLogs.id));

		const rows = options?.limit !== undefined
			? await query.limit(options.limit)
			: await query;

		return rows.map((row) => row.data);
	} catch (error) {
		console.error("[DB Error] Failed to fetch security logs:", error);
		return [];
	}
}

/**
 * 특정 시점 중심 윈도우 페칭 (위쪽 최신 N개 + 타겟 포함 아래쪽 M개)
 */
export async function fetchSecurityLogsAround(
	targetTimestamp: number,
	types?: SecurityLogType[],
	limit = 10,
): Promise<{
	logs: IncomingIPCMessage[];
	hasMoreTop: boolean;
	hasMoreBottom: boolean;
	topOffset: number;
}> {
	try {
		const db = getDB();
		const afterCount = Math.max(1, Math.floor(limit * 0.4)); // e.g. 4 for limit 10
		const beforeCount = Math.max(1, limit - afterCount); // e.g. 6 for limit 10

		const typeCond = types && types.length > 0 ? inArray(table.securityLogs.type, types) : undefined;

		// 1. 위쪽(최신) 데이터 가져오기: afterCount + 1개 가져와서 hasMoreTop 여부 판별
		const newerConditions = [gt(table.securityLogs.timestamp, targetTimestamp)];
		if (typeCond) newerConditions.push(typeCond);

		const newerRows = await db.select()
			.from(table.securityLogs)
			.where(and(...newerConditions))
			.orderBy(asc(table.securityLogs.timestamp), asc(table.securityLogs.id))
			.limit(afterCount + 1);

		const hasMoreTop = newerRows.length > afterCount;
		if (hasMoreTop) newerRows.pop();
		newerRows.reverse();

		let totalNewerCount = newerRows.length;
		if (hasMoreTop) {
			const countRows = await db
				.select({ count: sql<number>`count(*)` })
				.from(table.securityLogs)
				.where(and(...newerConditions));
			totalNewerCount = countRows[0]?.count ?? newerRows.length;
		}

		// 2. 아래쪽(타겟 포함 과거) 데이터 가져오기: beforeCount + 1개 가져와서 hasMoreBottom 여부 판별
		const olderConditions = [lte(table.securityLogs.timestamp, targetTimestamp)];
		if (typeCond) olderConditions.push(typeCond);

		const olderRows = await db.select()
			.from(table.securityLogs)
			.where(and(...olderConditions))
			.orderBy(desc(table.securityLogs.timestamp), desc(table.securityLogs.id))
			.limit(beforeCount + 1);

		const hasMoreBottom = olderRows.length > beforeCount;
		if (hasMoreBottom) olderRows.pop();

		const combinedRows = [...newerRows, ...olderRows];
		const topOffset = Math.max(0, totalNewerCount - newerRows.length);

		return {
			logs: combinedRows.map((r) => r.data),
			hasMoreTop,
			hasMoreBottom,
			topOffset,
		};
	} catch (error) {
		console.error("[DB Error] Failed to fetch security logs around:", error);
		return { logs: [], hasMoreTop: false, hasMoreBottom: false, topOffset: 0 };
	}
}

export interface DailyChartStatsItem {
	date: string;
	threat: number;
	processTerminated: number;
	recovery: number;
	fileRename: number;
	fileWrite: number;
	processCreate: number;
	firewall: number;
	queueDepth: number;
	eventsDropped: number;
	blockedCount: number;
	terminatedCount: number;
}

export interface TotalLogCounts {
	threat: number;
	recovery: number;
	telemetry: number;
	blockedProcesses: number;
	accessControlLogs: number;
}

/**
 * 대시보드 차트, 상단 수치 카드 및 전체 탭 카운트 집계 (DB에서 카운트만 가볍게 계산)
 */
export async function getDashboardStatsAndCounts(days = 90): Promise<{
	dailyStats: DailyChartStatsItem[];
	totalCounts: TotalLogCounts;
}> {
	const totalCounts: TotalLogCounts = {
		threat: 0,
		recovery: 0,
		telemetry: 0,
		blockedProcesses: 0,
		accessControlLogs: 0,
	};

	try {
		const db = getDB();
		const startDate = new Date();
		startDate.setHours(0, 0, 0, 0);
		startDate.setDate(startDate.getDate() - (days - 1));
		const startTime = startDate.getTime();

		const [secRows, acRows] = await Promise.all([
			db.select({
				type: table.securityLogs.type,
				timestamp: table.securityLogs.timestamp,
				data: table.securityLogs.data,
			}).from(table.securityLogs),
			db.select({
				ips: table.accessControlLogs.ips,
				performedAt: table.accessControlLogs.performedAt,
			}).from(table.accessControlLogs),
		]);

		const dailyMap = new Map<string, DailyChartStatsItem>();
		const toDateKey = (ts: number) => {
			const d = new Date(ts);
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, "0");
			const day = String(d.getDate()).padStart(2, "0");
			return `${year}-${month}-${day}`;
		};

		const getOrCreateDay = (dateKey: string): DailyChartStatsItem => {
			let item = dailyMap.get(dateKey);
			if (!item) {
				item = {
					date: dateKey,
					threat: 0,
					processTerminated: 0,
					recovery: 0,
					fileRename: 0,
					fileWrite: 0,
					processCreate: 0,
					firewall: 0,
					queueDepth: 0,
					eventsDropped: 0,
					blockedCount: 0,
					terminatedCount: 0,
				};
				dailyMap.set(dateKey, item);
			}
			return item;
		};

		for (const ac of acRows) {
			const count = ac.ips && ac.ips.length > 0 ? ac.ips.length : 1;
			totalCounts.accessControlLogs += count;

			if (ac.performedAt >= startTime) {
				const dateKey = toDateKey(ac.performedAt);
				const item = getOrCreateDay(dateKey);
				item.firewall += count;
			}
		}

		for (const row of secRows) {
			// 1. 전체 탭/뱃지용 최종 카운트 집계
			if (row.type === "VSS_STATUS") {
				totalCounts.recovery += 1;
			} else if (
				row.type === "PROCESS_BLOCKED" ||
				row.type === "VSS_ATTEMPT" ||
				row.type === "ALERT"
			) {
				totalCounts.threat += 1;
				if (
					row.type === "PROCESS_BLOCKED" ||
					(row.type === "ALERT" &&
						row.data.type === "ALERT" &&
						(row.data.data.action === "BLOCKED" || row.data.data.action === "QUARANTINED"))
				) {
					totalCounts.blockedProcesses += 1;
				}
			} else if (
				row.type === "PROCESS_CREATE" ||
				row.type === "PROCESS_TERMINATE" ||
				row.type === "FILE_WRITE" ||
				row.type === "FILE_RENAME"
			) {
				totalCounts.telemetry += 1;
			}

			// 2. 차트 기간 내 일별 통계 집계
			if (row.timestamp >= startTime) {
				const dateKey = toDateKey(row.timestamp);
				const item = getOrCreateDay(dateKey);

				if (row.type === "VSS_STATUS") {
					item.recovery += 1;
				} else if (
					row.type === "PROCESS_BLOCKED" ||
					row.type === "VSS_ATTEMPT" ||
					row.type === "ALERT"
				) {
					item.threat += 1;
				} else if (row.type === "PROCESS_TERMINATE") {
					item.processTerminated += 1;
				} else if (row.type === "PROCESS_CREATE") {
					item.processCreate += 1;
				} else if (row.type === "FILE_RENAME") {
					item.fileRename += 1;
				} else if (row.type === "FILE_WRITE") {
					item.fileWrite += 1;
				}

				const isBlocked =
					row.type === "PROCESS_BLOCKED" ||
					row.type === "VSS_ATTEMPT" ||
					(row.type === "ALERT" && row.data.type === "ALERT" && row.data.data.action !== "ALLOWED");

				if (isBlocked) {
					item.blockedCount += 1;
				}

				if (row.type === "PROCESS_TERMINATE") {
					item.terminatedCount += 1;
				}
			}
		}

		return {
			dailyStats: Array.from(dailyMap.values()),
			totalCounts,
		};
	} catch (error) {
		console.error("[DB Error] Failed to fetch dashboard stats and counts:", error);
		return {
			dailyStats: [],
			totalCounts,
		};
	}
}

/**
 * 최근 보안 로그 조회 (초기 캐시 데이터 로드용)
 */
export async function getRecentSecurityLogs(limit = 10) {
	return fetchSecurityLogs({ limit });
}

export interface FetchAccessControlLogsOptions {
	beforeTimestamp?: number;
	afterTimestamp?: number;
	limit?: number;
	direction?: "older" | "newer";
}

/**
 * 최근 접근 제어 로그 조회 (무한 스크롤 및 초기 로드용)
 */
export async function getRecentAccessControlLogs(options?: number | FetchAccessControlLogsOptions) {
	try {
		const db = getDB();
		const opts: FetchAccessControlLogsOptions = typeof options === "number"
			? { limit: options }
			: (options ?? { limit: 10 });

		const conditions = [];

		if (opts.direction === "newer") {
			if (opts.afterTimestamp !== undefined) {
				conditions.push(gt(table.accessControlLogs.performedAt, opts.afterTimestamp));
			}

			const query = db.select()
				.from(table.accessControlLogs)
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(asc(table.accessControlLogs.performedAt), asc(table.accessControlLogs.id));

			const rows = opts.limit !== undefined
				? await query.limit(opts.limit)
				: await query;

			rows.reverse();
			return rows;
		}

		if (opts.beforeTimestamp !== undefined) {
			conditions.push(lt(table.accessControlLogs.performedAt, opts.beforeTimestamp));
		}
		if (opts.afterTimestamp !== undefined) {
			conditions.push(gte(table.accessControlLogs.performedAt, opts.afterTimestamp));
		}

		const query = db.select()
			.from(table.accessControlLogs)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(table.accessControlLogs.performedAt), desc(table.accessControlLogs.id));

		const rows = opts.limit !== undefined
			? await query.limit(opts.limit)
			: await query;

		return rows;
	} catch (error) {
		console.error("[DB Error] Failed to fetch recent access control logs:", error);
		return [];
	}
}

/**
 * 특정 시점 중심 접근 제어 로그 윈도우 페칭
 */
export async function getRecentAccessControlLogsAround(
	targetTimestamp: number,
	limit = 10,
) {
	try {
		const db = getDB();
		const afterCount = Math.max(1, Math.floor(limit * 0.4));
		const beforeCount = Math.max(1, limit - afterCount);

		const newerRows = await db.select()
			.from(table.accessControlLogs)
			.where(gt(table.accessControlLogs.performedAt, targetTimestamp))
			.orderBy(asc(table.accessControlLogs.performedAt), asc(table.accessControlLogs.id))
			.limit(afterCount + 1);

		const hasMoreTop = newerRows.length > afterCount;
		if (hasMoreTop) newerRows.pop();
		newerRows.reverse();

		let totalNewerCount = newerRows.length;
		if (hasMoreTop) {
			const countRows = await db
				.select({ count: sql<number>`count(*)` })
				.from(table.accessControlLogs)
				.where(gt(table.accessControlLogs.performedAt, targetTimestamp));
			totalNewerCount = countRows[0]?.count ?? newerRows.length;
		}

		const olderRows = await db.select()
			.from(table.accessControlLogs)
			.where(lte(table.accessControlLogs.performedAt, targetTimestamp))
			.orderBy(desc(table.accessControlLogs.performedAt), desc(table.accessControlLogs.id))
			.limit(beforeCount + 1);

		const hasMoreBottom = olderRows.length > beforeCount;
		if (hasMoreBottom) olderRows.pop();

		const topOffset = Math.max(0, totalNewerCount - newerRows.length);

		return {
			rows: [...newerRows, ...olderRows],
			hasMoreTop,
			hasMoreBottom,
			topOffset,
		};
	} catch (error) {
		console.error("[DB Error] Failed to fetch access control logs around:", error);
		return { rows: [], hasMoreTop: false, hasMoreBottom: false, topOffset: 0 };
	}
}
