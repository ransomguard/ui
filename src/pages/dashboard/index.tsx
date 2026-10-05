import { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import {
	ShieldBan,
	ZapOff,
	Layers,
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

const MAX_CHART_DAYS = timeRangeItems[0].value;

export default function Dashboard() {
	const { t } = useTranslation();

	const sysData = useStatusStore((state) => state.data);

	const storeBlockedIps = useAccessControlStore((state) => state.blockedIps);
	const storeWhitelistIps = useAccessControlStore((state) => state.whitelistIps);
	const storeLogs = useAccessControlStore((state) => state.logs);
	const storeIsLoading = useAccessControlStore((state) => state.isLoading);

	const metrics = useMetricStore((state) => state.metrics);
	const alerts = useAlertStore((state) => state.alerts);
	const telemetryEvents = useTelemetryStore((state) => state.events);

	const [timeRange, setTimeRange] = useState<TimeRangeItem>(timeRangeItems[0]);

	const updateTimeRange = (value: TimeRangeItem | null) => {
		setTimeRange(value ?? timeRangeItems[0]);
	};

	// 1. 위협(threat) 및 복구(recovery) 요약 생성
	const alertAndRecoverySummaries: DashboardSummaryEventItem[] = alerts.map((item, idx) => {
		const timestamp = item.timestamp;
		const createdAt = timestamp ? new Date(timestamp).toLocaleString() : "-";

		if (item.type === "VSS_STATUS") {
			return {
				id: `recovery-${timestamp}-${idx}`,
				category: "recovery",
				action: item.data.action,
				target: extractBaseName(item.data.targetPath),
				summary: item.data.message,
				timestamp,
				createdAt,
			};
		}

		if (item.type === "ALERT") {
			return {
				id: `threat-${timestamp}-${idx}`,
				category: "threat",
				action: `ALERT (${item.data.action})`,
				target: item.data.processName || extractBaseName(item.data.filePath),
				summary: t(($) => $.recentEvents.threatScoreSummary, {
					ruleName: item.data.ruleName,
					score: item.data.threatScore,
				}),
				timestamp,
				createdAt,
			};
		}

		if (item.type === "PROCESS_BLOCKED") {
			const procName = extractBaseName(item.data.imagePath);
			return {
				id: `threat-${timestamp}-${idx}`,
				category: "threat",
				action: "PROCESS_BLOCKED",
				target: procName !== "-" ? procName : `PID ${item.data.processId}`,
				summary: item.data.matchedRuleId
					? t(($) => $.recentEvents.ruleSummary, {
						ruleId: item.data.matchedRuleId,
						pid: item.data.processId,
					})
					: t(($) => $.recentEvents.pidSummary, { pid: item.data.processId }),
				timestamp,
				createdAt,
			};
		}

		// VSS_ATTEMPT
		return {
			id: `threat-${timestamp}-${idx}`,
			category: "threat",
			action: "VSS_ATTEMPT",
			target: `PID ${item.data.processId}`,
			summary: item.data.action,
			timestamp,
			createdAt,
		};
	});

	// 2. 이벤트(telemetry) 요약 생성
	const telemetrySummaries: DashboardSummaryEventItem[] = telemetryEvents.map((item, idx) => {
		const timestamp = item.timestamp;
		const createdAt = timestamp ? new Date(timestamp).toLocaleString() : "-";

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
			};
		});
	});

	const unloggedBlockedSummaries: DashboardSummaryEventItem[] = storeBlockedIps
		.filter((ip) => !loggedIps.has(`block:${ip}`))
		.map((ip) => ({
			id: `firewall-block-${ip}`,
			category: "firewall",
			action: "BLOCK_ADD",
			target: ip,
			summary: t(($) => $.recentEvents.defaultReason),
			timestamp: 0,
			createdAt: "-",
		}));

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
		}));

	const summaryEvents: DashboardSummaryEventItem[] = [
		...alertAndRecoverySummaries,
		...telemetrySummaries,
		...firewallLogSummaries,
		...unloggedBlockedSummaries,
		...unloggedWhitelistSummaries,
	].sort((a, b) => b.timestamp - a.timestamp);

	// 날짜별 차단(desktop) 및 감시(mobile) 이벤트 집계
	const dailyCounts = new Map<string, { desktop: number; mobile: number }>();

	const addCount = (dateKey: string, type: "desktop" | "mobile", amount = 1) => {
		const prev = dailyCounts.get(dateKey) ?? { desktop: 0, mobile: 0 };
		prev[type] += amount;
		dailyCounts.set(dateKey, prev);
	};

	for (const alert of alerts) {
		const dateKey = toDateKey(alert.timestamp);
		const isBlocked =
			alert.type === "PROCESS_BLOCKED" ||
			alert.type === "VSS_ATTEMPT" ||
			(alert.type === "ALERT" && alert.data.action !== "ALLOWED");

		addCount(dateKey, isBlocked ? "desktop" : "mobile");
	}

	for (const event of telemetryEvents) {
		const dateKey = toDateKey(event.timestamp);
		addCount(dateKey, "mobile");
	}

	for (const metric of metrics) {
		if (metric.type === "SYSTEM_STATUS") {
			const dateKey = toDateKey(metric.timestamp);
			if (!dailyCounts.has(dateKey)) {
				addCount(
					dateKey,
					"desktop",
					metric.data.processesBlocked + metric.data.processesTerminated,
				);
				addCount(dateKey, "mobile", metric.data.eventsGenerated);
			}
		}
	}

	const chartItems: AreaChartDataItem[] = Array.from({ length: MAX_CHART_DAYS }).map((_, i) => {
		const d = new Date();
		d.setDate(d.getDate() - (MAX_CHART_DAYS - 1 - i));
		const dateStr = toDateKey(d);
		const counts = dailyCounts.get(dateStr);

		return {
			date: dateStr,
			desktop: counts?.desktop ?? 0,
			mobile: counts?.mobile ?? 0,
		};
	});

	const filteredChartData = chartItems.slice(-timeRange.value);

	const eventsDroppedCount = sysData?.eventsDropped ?? 0;

	const statsItems: StatsItem[] = [
		{
			icon: ShieldBan,
			label: "processesBlocked",
			description: "processesBlockedDesc",
			value: (sysData?.processesBlocked ?? 0).toLocaleString(),
		},
		{
			icon: ZapOff,
			label: "processesTerminated",
			description: "processesTerminatedDesc",
			value: (sysData?.processesTerminated ?? 0).toLocaleString(),
		},
		{
			icon: Layers,
			label: "queueDepth",
			description: "queueDepthDesc",
			value: (sysData?.queueDepth ?? 0).toLocaleString(),
		},
		{
			icon: AlertTriangle,
			label: "eventsDropped",
			description: "eventsDroppedDesc",
			value: eventsDroppedCount.toLocaleString(),
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
					isLoading={storeIsLoading}
				/>
			</Suspense>
		</div>
	);
}
