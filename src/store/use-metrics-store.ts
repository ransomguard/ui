import { create } from "zustand";



export type MetricMessage = ExtractIncomingIPCMessage<MetricType>;
type MetricType = typeof metricTypes[number];
const metricTypes = [
	"SYSTEM_STATUS",
	"ALERT",
] as const;
const metricTypesSet = new Set(metricTypes);

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

const DEFAULT_TOTAL_COUNTS: TotalLogCounts = {
	threat: 0,
	recovery: 0,
	telemetry: 0,
	blockedProcesses: 0,
	accessControlLogs: 0,
};

export interface MetricState {
	metrics: MetricMessage[];
	dailyStats: DailyChartStatsItem[];
	totalCounts: TotalLogCounts;
	initMetrics: (
		logs: IncomingIPCMessage[],
		dailyStats?: DailyChartStatsItem[],
		totalCounts?: TotalLogCounts,
	) => void;
	addMetrics: (logs: IncomingIPCMessage[]) => void;
	incrementAccessLogCount: (amount: number) => void;
}



const toDateKey = (ts: number) => {
	const d = new Date(ts);
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const filterItems = (logs: IncomingIPCMessage[]) => logs.filter(x => metricTypesSet.has(x.type as MetricType)) as MetricMessage[];
const sortItems = (logs: MetricMessage[]) => logs.sort((a, b) => b.timestamp - a.timestamp);

export const useMetricStore = create<MetricState>((set) => ({
	metrics: [],
	dailyStats: [],
	totalCounts: DEFAULT_TOTAL_COUNTS,
	initMetrics: (logs, dailyStats = [], totalCounts = DEFAULT_TOTAL_COUNTS) => set(() => {
		const newItems = filterItems(logs);
		const metrics = sortItems(newItems);
		return { metrics, dailyStats, totalCounts };
	}),
	addMetrics: (logs) => set((state) => {
		const newItems = filterItems(logs);
		const combined = [...newItems, ...state.metrics];
		const metrics = sortItems(combined);

		const statsMap = new Map<string, DailyChartStatsItem>();
		for (const s of state.dailyStats) {
			statsMap.set(s.date, { ...s });
		}

		const nextTotalCounts = { ...state.totalCounts };

		for (const item of logs) {
			if (item.type === "SYSTEM_STATUS") continue;

			if (item.type === "VSS_STATUS") {
				nextTotalCounts.recovery += 1;
			} else if (
				item.type === "PROCESS_BLOCKED" ||
				item.type === "VSS_ATTEMPT" ||
				item.type === "ALERT"
			) {
				nextTotalCounts.threat += 1;
				if (
					item.type === "PROCESS_BLOCKED" ||
					(item.type === "ALERT" &&
						(item.data.action === "BLOCKED" || item.data.action === "QUARANTINED"))
				) {
					nextTotalCounts.blockedProcesses += 1;
				}
			} else if (
				item.type === "PROCESS_CREATE" ||
				item.type === "PROCESS_TERMINATE" ||
				item.type === "FILE_WRITE" ||
				item.type === "FILE_RENAME"
			) {
				nextTotalCounts.telemetry += 1;
			}

			const dateKey = toDateKey(item.timestamp);
			const stat = statsMap.get(dateKey) ?? {
				date: dateKey,
				threat: 0,
				recovery: 0,
				process: 0,
				file: 0,
				firewall: 0,
				blockedCount: 0,
				terminatedCount: 0,
			};

			if (item.type === "VSS_STATUS") {
				stat.recovery += 1;
			} else if (
				item.type === "PROCESS_BLOCKED" ||
				item.type === "VSS_ATTEMPT" ||
				item.type === "ALERT"
			) {
				stat.threat += 1;
			} else if (
				item.type === "PROCESS_CREATE" ||
				item.type === "PROCESS_TERMINATE"
			) {
				stat.process += 1;
			} else if (
				item.type === "FILE_WRITE" ||
				item.type === "FILE_RENAME"
			) {
				stat.file += 1;
			}

			const isBlocked =
				item.type === "PROCESS_BLOCKED" ||
				item.type === "VSS_ATTEMPT" ||
				(item.type === "ALERT" && item.data.action !== "ALLOWED");

			if (isBlocked) {
				stat.blockedCount += 1;
			}

			if (item.type === "PROCESS_TERMINATE") {
				stat.terminatedCount += 1;
			}

			statsMap.set(dateKey, stat);
		}

		return {
			metrics,
			dailyStats: Array.from(statsMap.values()),
			totalCounts: nextTotalCounts,
		};
	}),
	incrementAccessLogCount: (amount) => set((state) => {
		const dateKey = toDateKey(Date.now());
		const statsMap = new Map<string, DailyChartStatsItem>();
		for (const s of state.dailyStats) {
			statsMap.set(s.date, { ...s });
		}
		const stat = statsMap.get(dateKey) ?? {
			date: dateKey,
			threat: 0,
			recovery: 0,
			process: 0,
			file: 0,
			firewall: 0,
			blockedCount: 0,
			terminatedCount: 0,
		};
		stat.firewall += amount;
		statsMap.set(dateKey, stat);

		return {
			dailyStats: Array.from(statsMap.values()),
			totalCounts: {
				...state.totalCounts,
				accessControlLogs: state.totalCounts.accessControlLogs + amount,
			},
		};
	}),
}));
