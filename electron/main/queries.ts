import { and, inArray, gte, gt, lt, desc } from "drizzle-orm";

import { acknowledgedThreat } from "~/store";
import { getDB, table } from "~/db";
import type { SecurityLogType } from "~/db/schema/security-logs";



export interface FetchSecurityLogsOptions {
	types?: SecurityLogType[];
	beforeTimestamp?: number;
	afterTimestamp?: number;
	limit?: number;
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

export interface DailyChartStatsItem {
	date: string;
	threat: number;
	recovery: number;
	process: number;
	file: number;
	firewall: number;
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
					recovery: 0,
					process: 0,
					file: 0,
					firewall: 0,
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
				} else if (
					row.type === "PROCESS_CREATE" ||
					row.type === "PROCESS_TERMINATE"
				) {
					item.process += 1;
				} else if (
					row.type === "FILE_WRITE" ||
					row.type === "FILE_RENAME"
				) {
					item.file += 1;
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
	limit?: number;
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
		if (opts.beforeTimestamp !== undefined) {
			conditions.push(lt(table.accessControlLogs.performedAt, opts.beforeTimestamp));
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
