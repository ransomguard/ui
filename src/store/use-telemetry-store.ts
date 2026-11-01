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
	hasMoreBottom: boolean;
	hasMoreTop: boolean;
	isLoadingMore: boolean;
	isLoadingMoreBottom: boolean;
	isLoadingMoreTop: boolean;

	initEvents: (logs: IncomingIPCMessage[]) => void;
	addEvents: (logs: IncomingIPCMessage[]) => void;
	fetchMoreEvents: () => Promise<void>;
	fetchMoreEventsBottom: () => Promise<void>;
	fetchMoreEventsTop: () => Promise<void>;
	loadEventsAround: (timestamp: number) => Promise<boolean>;
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
	hasMoreBottom: true,
	hasMoreTop: false,
	isLoadingMore: false,
	isLoadingMoreBottom: false,
	isLoadingMoreTop: false,

	initEvents: (logs) => set((state) => {
		const newItems = filterItems(logs);
		const events = mergeAndSortItems(state.events, newItems);
		const hasMore = newItems.length >= PAGE_SIZE;
		return {
			events,
			hasMore,
			hasMoreBottom: hasMore,
			hasMoreTop: false,
		};
	}),

	addEvents: (logs) => set((state) => {
		const newItems = filterItems(logs);
		if (newItems.length === 0) return state;
		const events = mergeAndSortItems(state.events, newItems);
		return { events };
	}),

	fetchMoreEvents: async () => {
		return get().fetchMoreEventsBottom();
	},

	fetchMoreEventsBottom: async () => {
		const { events, hasMoreBottom, isLoadingMoreBottom } = get();
		if (!hasMoreBottom || isLoadingMoreBottom) return;

		set({ isLoadingMore: true, isLoadingMoreBottom: true });
		try {
			const oldestTimestamp = events.length > 0 ? events.at(-1)!.timestamp : undefined;
			const logs = await window.electronAPI.getSecurityLogs({
				types: [...telemetryTypes],
				beforeTimestamp: oldestTimestamp,
				limit: PAGE_SIZE,
			});

			const newItems = filterItems(logs);
			const hasMore = logs.length >= PAGE_SIZE;
			set((state) => ({
				events: mergeAndSortItems(state.events, newItems),
				hasMore,
				hasMoreBottom: hasMore,
			}));
		} catch (err) {
			console.error("[useTelemetryStore] fetchMoreEventsBottom failed:", err);
		} finally {
			set({ isLoadingMore: false, isLoadingMoreBottom: false });
		}
	},

	fetchMoreEventsTop: async () => {
		const { events, hasMoreTop, isLoadingMoreTop } = get();
		if (!hasMoreTop || isLoadingMoreTop || events.length === 0) return;

		set({ isLoadingMoreTop: true });
		try {
			const newestTimestamp = events[0]?.timestamp;
			if (newestTimestamp === undefined) return;
			const logs = await window.electronAPI.getSecurityLogs({
				types: [...telemetryTypes],
				afterTimestamp: newestTimestamp,
				limit: PAGE_SIZE,
				direction: "newer",
			});

			const newItems = filterItems(logs);
			set((state) => ({
				events: mergeAndSortItems(state.events, newItems),
				hasMoreTop: logs.length >= PAGE_SIZE,
			}));
		} catch (err) {
			console.error("[useTelemetryStore] fetchMoreEventsTop failed:", err);
		} finally {
			set({ isLoadingMoreTop: false });
		}
	},

	loadEventsAround: async (timestamp: number) => {
		try {
			const result = await window.electronAPI.getSecurityLogsAround(timestamp, [...telemetryTypes], PAGE_SIZE);
			const newItems = filterItems(result.logs);
			if (newItems.length > 0) {
				set({
					events: newItems,
					hasMoreTop: result.hasMoreTop,
					hasMore: result.hasMoreBottom,
					hasMoreBottom: result.hasMoreBottom,
				});
				return true;
			}
			return false;
		} catch (err) {
			console.error("[useTelemetryStore] loadEventsAround failed:", err);
			return false;
		}
	},
}));
