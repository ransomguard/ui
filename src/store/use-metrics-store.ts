import { create } from "zustand";



export type MetricMessage = ExtractIncomingIPCMessage<MetricType>;
type MetricType = typeof metricTypes[number];
const metricTypes = [
	"SYSTEM_STATUS",
	"ALERT",
] as const;
const metricTypesSet = new Set(metricTypes);

export interface MetricState {
	metrics: MetricMessage[];
	initMetrics: (logs: IncomingIPCMessage[]) => void;
	addMetrics: (logs: IncomingIPCMessage[]) => void;
}



const filterItems = (logs: IncomingIPCMessage[]) => logs.filter(x => metricTypesSet.has(x.type as MetricType)) as MetricMessage[];
const sortItems = (logs: MetricMessage[]) => logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 200);

export const useMetricStore = create<MetricState>((set) => ({
	metrics: [],
	initMetrics: (logs) => set(() => {
		const newItems = filterItems(logs);
		const metrics = sortItems(newItems);
		return { metrics };
	}),
	addMetrics: (logs) => set((state) => {
		const newItems = filterItems(logs);
		const combined = [...newItems, ...state.metrics];
		const metrics = sortItems(combined);
		return { metrics };
	}),
}));
