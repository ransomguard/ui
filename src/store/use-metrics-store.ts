import { takeOutcomes } from "~/services/outcome-metrics";
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
	outcomeKeys?: string[];
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
        const seen = new Set(state.totalCounts.outcomeKeys ?? []);

		for (const item of logs) {
			const dateKey = toDateKey(item.timestamp);
			const stat = statsMap.get(dateKey) ?? {
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

			if (item.type === "SYSTEM_STATUS") {
				stat.queueDepth = Math.max(stat.queueDepth, item.data.queueDepth);
				stat.eventsDropped = Math.max(stat.eventsDropped, item.data.eventsDropped);
				statsMap.set(dateKey, stat);
				continue;
			}

            const counts = takeOutcomes(item, seen);
            nextTotalCounts.blockedProcesses += counts.blocked;
            nextTotalCounts.threat += counts.blocked + counts.terminated;
            nextTotalCounts.recovery += counts.recovered;
            if (["PROCESS_CREATE","PROCESS_TERMINATE","FILE_WRITE","FILE_RENAME"].includes(item.type)) nextTotalCounts.telemetry++;
            stat.threat += counts.blocked;
            stat.blockedCount += counts.blocked;
            stat.processTerminated += counts.terminated;
            stat.terminatedCount += counts.terminated;
            stat.recovery += counts.recovered;
            if (item.type === "PROCESS_CREATE") stat.processCreate++;
            if (item.type === "FILE_WRITE") stat.fileWrite++;
            if (item.type === "FILE_RENAME") stat.fileRename++;

			statsMap.set(dateKey, stat);
		}

        nextTotalCounts.outcomeKeys = [...seen];
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
