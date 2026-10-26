import { create } from "zustand";



export type TelemetryMessage = ExtractIncomingIPCMessage<TelemetryType>;
type TelemetryType = typeof telemetryTypes[number];
const telemetryTypes = [
	"PROCESS_CREATE",
	"PROCESS_TERMINATE",
	"FILE_WRITE",
	"FILE_RENAME",
] as const;
const telemetryTypesSet = new Set(telemetryTypes);
const PAGE_SIZE = 10;

export interface TelemetryState {
	events: TelemetryMessage[];
	hasMore: boolean;
	isLoadingMore: boolean;

	initEvents: (logs: IncomingIPCMessage[]) => void;
	addEvents: (logs: IncomingIPCMessage[]) => void;
	fetchMoreEvents: () => Promise<void>;
}



const getItemKey = (item: TelemetryMessage) =>
	item.sequenceNumber != null
		? `${item.type}-${item.timestamp}-${item.sequenceNumber}`
		: `${item.type}-${item.timestamp}-${JSON.stringify(item.data)}`;

const filterItems = (logs: IncomingIPCMessage[]) => logs.filter(x => telemetryTypesSet.has(x.type as TelemetryType)) as TelemetryMessage[];

const mergeAndSortItems = (existing: TelemetryMessage[], incoming: TelemetryMessage[]) => {
	const map = new Map<string, TelemetryMessage>();
	for (const item of existing) {
		map.set(getItemKey(item), item);
	}
	for (const item of incoming) {
		map.set(getItemKey(item), item);
	}
	return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
};

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
	events: [],
	hasMore: true,
	isLoadingMore: false,

	initEvents: (logs) => set((state) => {
		const newItems = filterItems(logs);
		const events = mergeAndSortItems(state.events, newItems);
		return { events, hasMore: newItems.length >= PAGE_SIZE };
	}),

	addEvents: (logs) => set((state) => {
		const newItems = filterItems(logs);
		if (newItems.length === 0) return state;
		const events = mergeAndSortItems(state.events, newItems);
		return { events };
	}),

	fetchMoreEvents: async () => {
		const { events, hasMore, isLoadingMore } = get();
		if (!hasMore || isLoadingMore) return;

		set({ isLoadingMore: true });
		try {
			const oldestTimestamp = events.length > 0 ? events.at(-1)!.timestamp : undefined;
			const logs = await window.electronAPI.getSecurityLogs({
				types: [...telemetryTypes],
				beforeTimestamp: oldestTimestamp,
				limit: PAGE_SIZE,
			});

			const newItems = filterItems(logs);
			set((state) => ({
				events: mergeAndSortItems(state.events, newItems),
				hasMore: logs.length >= PAGE_SIZE,
			}));
		} catch (err) {
			console.error("[useTelemetryStore] fetchMoreEvents failed:", err);
		} finally {
			set({ isLoadingMore: false });
		}
	},
}));
