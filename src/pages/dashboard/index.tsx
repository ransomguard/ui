import { evidenceLabel } from "~/services/outcome-metrics";
import { useState, useEffect, lazy, Suspense, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
	ShieldBan,
	ZapOff,
	RefreshCw,
	AlertTriangle,
} from "lucide-react";

import {
	useStatusStore,
	useAccessControlStore,
	useMetricStore,
	useAlertStore,
	useTelemetryStore,
} from "@/store";

import { Skeleton } from "@/components/ui/skeleton";

import { timeRangeItems, type TimeRangeItem } from "./common";
import StatsSection, { type StatsItem } from "./stats-section";
import type { AreaChartDataItem } from "./main-chart-section";
import type { DashboardSummaryEventItem } from "./ip-block-section";



const EngineStatus = lazy(() => import("@/components/engine-status"));
const MainChartSection = lazy(() => import("./main-chart-section"));
const RecentEventsSection = lazy(() => import("./ip-block-section"));



function EngineStatusFallback() {
	return (
		<Skeleton className="h-20 w-full rounded-xl"/>
	);
}

function StatsFallback() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<Skeleton key={i} className="h-28 rounded-xl"/>
			))}
		</div>
	);
}

function ChartFallback() {
	return (
		<Skeleton className="relative h-96 w-full rounded-xl"/>
	);
}

function RecentEventsFallback() {
	return (
		<div className="space-y-3 min-w-0">
			<Skeleton className="h-6 w-36 rounded"/>
			<Skeleton className="h-64 w-full rounded-xl"/>
		</div>
	);
}

function toDateKey(value: number | Date): string {
	const d = typeof value === "number" ? new Date(value) : value;
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function extractBaseName(pathStr?: string | null): string {
	if (!pathStr) return "-";
	return pathStr.split(/[/\\]/).pop() || pathStr;
}

const DEFAULT_TIME_RANGE = timeRangeItems.find(x => x.default) ?? timeRangeItems[0];

export default function Dashboard() {
	const { t } = useTranslation();

	const sysData = useStatusStore((state) => state.data);

	const storeWhitelistIps = useAccessControlStore((state) => state.whitelistIps);
	const storeLogs = useAccessControlStore((state) => state.logs);
	const storeHasMoreLogs = useAccessControlStore((state) => state.hasMoreLogs);
	const storeIsLoadingMoreLogs = useAccessControlStore((state) => state.isLoadingMoreLogs);
	const storeIsLoading = useAccessControlStore((state) => state.isLoading);
	const fetchMoreAccessLogs = useAccessControlStore((state) => state.fetchMoreLogs);

	const metrics = useMetricStore((state) => state.metrics);
	const dailyStats = useMetricStore((state) => state.dailyStats);
	const totalCounts = useMetricStore((state) => state.totalCounts);
	const alerts = useAlertStore((state) => state.alerts);
	const hasMoreAlerts = useAlertStore((state) => state.hasMore);
	const isLoadingMoreAlerts = useAlertStore((state) => state.isLoadingMore);
	const fetchMoreAlerts = useAlertStore((state) => state.fetchMoreAlerts);

	const telemetryEvents = useTelemetryStore((state) => state.events);
	const hasMoreTelemetry = useTelemetryStore((state) => state.hasMore);
	const isLoadingMoreTelemetry = useTelemetryStore((state) => state.isLoadingMore);
	const fetchMoreTelemetry = useTelemetryStore((state) => state.fetchMoreEvents);

	const [timeRange, setTimeRange] = useState<TimeRangeItem>(DEFAULT_TIME_RANGE);
	const [dbChartData, setDbChartData] = useState<AreaChartDataItem[]>([]);
	const currentQueryRef = useRef({ days: DEFAULT_TIME_RANGE.value, interval: DEFAULT_TIME_RANGE.interval });

	const loadChartStats = useCallback((days: number, interval: TimeRangeItem["interval"]) => {
		currentQueryRef.current = { days, interval };
		window.electronAPI?.getDashboardChartStats?.(days, interval).then((stats) => {
			if (currentQueryRef.current.days === days && currentQueryRef.current.interval === interval) {
				if (Array.isArray(stats)) {
					setDbChartData(stats as unknown as AreaChartDataItem[]);
				}
			}
		}).catch(() => {});
	}, []);

	useEffect(() => {
		window.electronAPI?.getDashboardTimeRange?.().then((savedDays) => {
			let targetRange = DEFAULT_TIME_RANGE;
			if (typeof savedDays === "number") {
				const found = timeRangeItems.find((item) => item.value === savedDays);
				if (found) {
					targetRange = found;
					setTimeRange(found);
				}
			}
			loadChartStats(targetRange.value, targetRange.interval);
		}).catch(() => {
			loadChartStats(DEFAULT_TIME_RANGE.value, DEFAULT_TIME_RANGE.interval);
		});
	}, [loadChartStats]);

	// 신규 실시간 이벤트 수신 시 차트 버킷 최신화 (디바운스 적용)
	// Refresh dirty charts even when a bounded cache's length no longer changes.
	const chartDirty = useRef(false);
	useEffect(() => {
		chartDirty.current = true;
	}, [alerts, telemetryEvents, storeLogs, metrics]);
	useEffect(() => {
		const timer = setInterval(() => {
			if (!chartDirty.current) return;
			chartDirty.current = false;
			loadChartStats(timeRange.value, timeRange.interval);
		}, 3000);
		return () => clearInterval(timer);
	}, [timeRange, loadChartStats]);

	const updateTimeRange = (value: TimeRangeItem | null) => {
		const next = value ?? DEFAULT_TIME_RANGE;
		setTimeRange(next);
		window.electronAPI?.setDashboardTimeRange?.(next.value).catch(() => {});
		loadChartStats(next.value, next.interval);
	};

	const handleLoadMoreSummary = async (category: "all" | "threat" | "recovery" | "telemetry" | "firewall") => {
		const tasks: Promise<unknown>[] = [];
		if (category === "all" || category === "threat" || category === "recovery") {
			tasks.push(fetchMoreAlerts());
		}
		if (category === "all" || category === "telemetry") {
			tasks.push(fetchMoreTelemetry());
		}
		if (category === "all" || category === "firewall") {
			tasks.push(fetchMoreAccessLogs());
		}
		await Promise.all(tasks);
	};

	const hasMoreByTab = {
		all: hasMoreAlerts || hasMoreTelemetry || storeHasMoreLogs,
		threat: hasMoreAlerts,
		recovery: hasMoreAlerts,
		telemetry: hasMoreTelemetry,
		firewall: storeHasMoreLogs,
	};
	const isLoadingMoreSummary = isLoadingMoreAlerts || isLoadingMoreTelemetry || storeIsLoadingMoreLogs;

	// 1. 위협/복구/텔레메트리/방화벽 통합 요약 이벤트 생성 (useMemo 캐싱으로 불필요한 반복 계산 및 프리징 방지)
	const { summaryEvents, tabTotalCounts } = useMemo(() => {
		const alertAndRecoverySummaries: DashboardSummaryEventItem[] = alerts.map((item, idx) => {
			const timestamp = item.timestamp;
			const createdAt = timestamp ? new Date(timestamp).toLocaleString() : "-";
			const itemKey = item.sequenceNumber != null
				? `${item.type}-${item.timestamp}-${item.sequenceNumber}`
				: `${item.type}-${item.timestamp}-${JSON.stringify(item.data)}`;

			if (item.type === "VSS_STATUS") {
				return {
					id: `recovery-${timestamp}-${idx}`,
					category: "recovery",
					action: evidenceLabel(item) + item.data.action,
					target: extractBaseName(item.data.targetPath),
					summary: item.data.message,
					timestamp,
					createdAt,
					rawId: item.sequenceNumber,
					itemKey,
				};
			}

			if (item.type === "ALERT") {
				return {
					id: `threat-${timestamp}-${idx}`,
					category: "threat",
					action: evidenceLabel(item) + `ALERT (${item.data.action})`,
					target: item.data.processName || extractBaseName(item.data.filePath),
					summary: t(($) => $.recentEvents.threatScoreSummary, {
						ruleName: item.data.ruleName,
						score: item.data.threatScore,
					}),
					timestamp,
					createdAt,
					rawId: item.sequenceNumber,
					itemKey,
				};
			}

			if (item.type === "PROCESS_BLOCKED") {
				const procName = extractBaseName(item.data.imagePath);
				return {
					id: `threat-${timestamp}-${idx}`,
					category: "threat",
					action: evidenceLabel(item) + "PROCESS_BLOCKED",
					target: procName !== "-" ? procName : `PID ${item.data.processId}`,
					summary: item.data.matchedRuleId
						? t(($) => $.recentEvents.ruleSummary, {
							ruleId: item.data.matchedRuleId,
							pid: item.data.processId,
						})
						: t(($) => $.recentEvents.pidSummary, { pid: item.data.processId }),
					timestamp,
					createdAt,
					rawId: item.sequenceNumber,
					itemKey,
				};
			}

			// VSS_ATTEMPT
			return {
				id: `threat-${timestamp}-${idx}`,
				category: "threat",
				action: evidenceLabel(item) + "VSS_ATTEMPT",
				target: `PID ${item.data.processId}`,
				summary: item.data.action,
				timestamp,
				createdAt,
				rawId: item.sequenceNumber,
				itemKey,
			};
		});

		// 2. 이벤트(telemetry) 요약 생성
		const telemetrySummaries: DashboardSummaryEventItem[] = telemetryEvents.map((item, idx) => {
			const timestamp = item.timestamp;
			const createdAt = timestamp ? new Date(timestamp).toLocaleString() : "-";
			const itemKey = item.sequenceNumber != null
				? `${item.type}-${item.timestamp}-${item.sequenceNumber}`
				: `${item.type}-${item.timestamp}-${JSON.stringify(item.data)}`;

			if (item.type === "PROCESS_CREATE" || item.type === "PROCESS_TERMINATE") {
				const procName = extractBaseName(item.data.imagePath);
				return {
					id: `telemetry-${timestamp}-${idx}`,
					category: "telemetry",
					action: item.type,
					target: procName !== "-" ? procName : `PID ${item.data.processId}`,
					summary: t(($) => $.recentEvents.pidPpidSummary, {
						pid: item.data.processId,
						ppid: item.data.parentProcessId,
					}),
					timestamp,
					createdAt,
					rawId: item.sequenceNumber,
					itemKey,
				};
			}

			// FILE_WRITE | FILE_RENAME
			const fileName = extractBaseName(item.data.filePath);
			const summary = item.type === "FILE_RENAME" && item.data.newExtension
				? t(($) => $.recentEvents.pidExtSummary, {
					pid: item.data.processId,
					ext: item.data.newExtension,
				})
				: t(($) => $.recentEvents.pidSummary, { pid: item.data.processId });

			return {
				id: `telemetry-${timestamp}-${idx}`,
				category: "telemetry",
				action: item.type,
				target: fileName !== "-" ? fileName : `PID ${item.data.processId}`,
				summary,
				timestamp,
				createdAt,
				rawId: item.sequenceNumber,
				itemKey,
			};
		});

		// 3. 방화벽(firewall) 요약 생성
		const loggedIps = new Set<string>();
		const firewallLogSummaries: DashboardSummaryEventItem[] = storeLogs.flatMap((log, idx) => {
			const timestamp = log.performedAt;
			const createdAt = timestamp ? new Date(timestamp).toLocaleString() : "-";
			const actionLabel = `${log.target.toUpperCase()}_${log.action.toUpperCase()}`;
			const summaryText = log.reason || (log.success ? t(($) => $.recentEvents.defaultReason) : log.errorMessage || "-");

			const maybeIps = (log as { ips?: string[] | null }).ips;
			const ipsList = log.ip ? [log.ip] : Array.isArray(maybeIps) && maybeIps.length > 0 ? maybeIps : ["-"];

			return ipsList.map((ip, ipIdx) => {
				if (ip !== "-") loggedIps.add(`${log.target}:${ip}`);
				return {
					id: `firewall-${log.id}-${idx}-${ipIdx}`,
					category: "firewall" as const,
					action: actionLabel,
					target: ip,
					summary: summaryText,
					timestamp,
					createdAt,
					rawId: log.id,
					itemKey: `ac-log-${log.id}-${ip !== "-" ? ip : ipIdx}`,
				};
			});
		});

		const unloggedWhitelistSummaries: DashboardSummaryEventItem[] = storeWhitelistIps
			.filter((ip) => !loggedIps.has(`whitelist:${ip}`))
			.map((ip) => ({
				id: `firewall-whitelist-${ip}`,
				category: "firewall",
				action: "WHITELIST_ADD",
				target: ip,
				summary: "-",
				timestamp: 0,
				createdAt: "-",
				rawId: ip,
				itemKey: `whitelist-ip-${ip}`,
			}));

		const summaryEvents: DashboardSummaryEventItem[] = [
			...alertAndRecoverySummaries,
			...telemetrySummaries,
			...firewallLogSummaries,
			...unloggedWhitelistSummaries,
		].sort((a, b) => b.timestamp - a.timestamp);

		const totalThreatCount = Math.max(totalCounts.threat, alertAndRecoverySummaries.filter(i => i.category === "threat").length);
		const totalRecoveryCount = Math.max(totalCounts.recovery, alertAndRecoverySummaries.filter(i => i.category === "recovery").length);
		const totalTelemetryCount = Math.max(totalCounts.telemetry, telemetrySummaries.length);
		const totalFirewallCount = Math.max(totalCounts.accessControlLogs, firewallLogSummaries.length)
			+ unloggedWhitelistSummaries.length;

		const tabTotalCounts = {
			all: totalThreatCount + totalRecoveryCount + totalTelemetryCount + totalFirewallCount,
			threat: totalThreatCount,
			recovery: totalRecoveryCount,
			telemetry: totalTelemetryCount,
			firewall: totalFirewallCount,
		};

		return { summaryEvents, tabTotalCounts };
	}, [alerts, telemetryEvents, storeLogs, storeWhitelistIps, totalCounts, t]);

	// 날짜별 통합 보안 이벤트 집계 (Electron에서 계산된 일별 통계 사용)
	const dailyCounts = useMemo(() => {
		const map = new Map<string, {
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
		}>();

		for (const stat of dailyStats) {
			map.set(stat.date, {
				threat: stat.threat,
				processTerminated: stat.processTerminated,
				recovery: stat.recovery,
				fileRename: stat.fileRename,
				fileWrite: stat.fileWrite,
				processCreate: stat.processCreate,
				firewall: stat.firewall,
				queueDepth: stat.queueDepth ?? 0,
				eventsDropped: stat.eventsDropped ?? 0,
				blockedCount: stat.blockedCount,
				terminatedCount: stat.terminatedCount,
			});
		}

		for (const metric of metrics) {
			if (metric.type === "SYSTEM_STATUS") {
				const dateKey = toDateKey(metric.timestamp);
				const existing = map.get(dateKey) ?? {
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
				existing.queueDepth = Math.max(existing.queueDepth, metric.data.queueDepth);
				existing.eventsDropped = Math.max(existing.eventsDropped, metric.data.eventsDropped);
				map.set(dateKey, existing);
			}
		}

		// 오늘 날짜에는 현재 sysData의 최신 queueDepth, eventsDropped도 실시간 반영
		const todayKey = toDateKey(Date.now());
		if (sysData) {
			const todayCounts = map.get(todayKey) ?? {
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
			todayCounts.queueDepth = Math.max(todayCounts.queueDepth, sysData.queueDepth);
			todayCounts.eventsDropped = Math.max(todayCounts.eventsDropped, sysData.eventsDropped);
			map.set(todayKey, todayCounts);
		}

		return map;
	}, [dailyStats, metrics, sysData]);

	// 선택한 차트 Time Range 범위 내 이벤트 필터링 및 상단 수치 카드 집계
	const rangeDateKeys = new Set(
		Array.from({ length: timeRange.value }).map((_, i) => {
			const d = new Date();
			d.setDate(d.getDate() - (timeRange.value - 1 - i));
			return toDateKey(d);
		}),
	);
	let logsBlockedCount = 0;
	let logsTerminatedCount = 0;
	let logsRecoveryCount = 0;
	for (const dateKey of rangeDateKeys) {
		const counts = dailyCounts.get(dateKey);
		if (counts) {
			logsBlockedCount += counts.threat || counts.blockedCount;
			logsTerminatedCount += counts.processTerminated || counts.terminatedCount;
			logsRecoveryCount += counts.recovery;
		}
	}

	const processesBlockedCount = logsBlockedCount;
	const processesTerminatedCount = logsTerminatedCount;
	const filesRecoveredCount = logsRecoveryCount;
	const eventsDroppedCount = sysData?.eventsDropped ?? 0;

	// DB 집계 데이터(dbChartData)를 기반으로 실시간 시스템 큐 상태 반영 (useMemo로 메모이제이션)
	const filteredChartData = useMemo(() => {
		if (dbChartData.length > 0) {
			const cloned = dbChartData.map((item) => ({ ...item }));
			if (sysData && cloned.length > 0) {
				const last = cloned[cloned.length - 1];
				if (last) {
					last.queueDepth = Math.max(Number(last.queueDepth ?? 0), sysData.queueDepth);
					last.eventsDropped = Math.max(Number(last.eventsDropped ?? 0), sysData.eventsDropped);
				}
			}
			return cloned;
		}

		// dbChartData가 아직 로드되지 않은 초기 찰나에만 기본 일별 데이터로 fallback 표시
		const days = timeRange.value;
		return Array.from({ length: days }).map((_, i) => {
			const d = new Date();
			d.setDate(d.getDate() - (days - 1 - i));
			const dateStr = toDateKey(d);
			const counts = dailyCounts.get(dateStr);

			return {
				date: dateStr,
				threat: counts?.threat ?? 0,
				processTerminated: counts?.processTerminated ?? 0,
				recovery: counts?.recovery ?? 0,
				fileRename: counts?.fileRename ?? 0,
				fileWrite: counts?.fileWrite ?? 0,
				processCreate: counts?.processCreate ?? 0,
				firewall: counts?.firewall ?? 0,
				queueDepth: counts?.queueDepth ?? 0,
				eventsDropped: counts?.eventsDropped ?? 0,
			};
		});
	}, [dbChartData, sysData, timeRange.value, dailyCounts]);

	const statsItems: StatsItem[] = [
		{
			icon: ShieldBan,
			label: "processesBlocked",
			description: "processesBlockedDesc",
			value: processesBlockedCount.toLocaleString(),
		},
		{
			icon: ZapOff,
			label: "processesTerminated",
			description: "processesTerminatedDesc",
			value: processesTerminatedCount.toLocaleString(),
		},
		{
			icon: RefreshCw,
			label: "filesRecovered",
			description: "filesRecoveredDesc",
			value: filesRecoveredCount.toLocaleString(),
		},
		{
			icon: AlertTriangle,
			label: "eventsDropped",
			description: "eventsDroppedDesc",
			value: sysData ? eventsDroppedCount.toLocaleString() : "—",
			className: eventsDroppedCount > 0
				? "border-destructive/60 bg-destructive/10 text-destructive dark:bg-destructive/20"
				: undefined,
		},
	];

	return (
		<div className="flex flex-col gap-6 min-w-0">
			{/* 1. 상태 히어로 배너 (최상단) */}
			<Suspense fallback={<EngineStatusFallback/>}>
				<EngineStatus/>
			</Suspense>

			{/* 2. 핵심 통계 위젯 (상단 4그리드 카드) */}
			<Suspense fallback={<StatsFallback/>}>
				<StatsSection
					items={statsItems}
					isLoading={false}
				/>
			</Suspense>

			{/* 3. 위협 차단 추이 차트 (중앙) */}
			<Suspense fallback={<ChartFallback/>}>
				<MainChartSection
					data={filteredChartData}
					timeRange={timeRange}
					timeRangeItems={timeRangeItems}
					onTimeRangeChange={updateTimeRange}
					isLoading={false}
				/>
			</Suspense>

			{/* 4. 최근 통합 이벤트(위협/복구/이벤트/방화벽) 요약 섹션 (하단) */}
			<Suspense fallback={<RecentEventsFallback/>}>
				<RecentEventsSection
					data={summaryEvents}
					totalCounts={tabTotalCounts}
					isLoading={storeIsLoading}
					hasMoreByTab={hasMoreByTab}
					isLoadingMore={isLoadingMoreSummary}
					onLoadMore={handleLoadMoreSummary}
				/>
			</Suspense>
		</div>
	);
}
