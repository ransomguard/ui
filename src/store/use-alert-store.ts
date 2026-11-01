import { create } from "zustand";



export type AlertMessage = ExtractIncomingIPCMessage<AlertType>;
type AlertType = typeof alertTypes[number];
const alertTypes = [
	"PROCESS_BLOCKED",
	"VSS_ATTEMPT",
	"ALERT",
	"VSS_STATUS"
] as const;
const alertTypesSet = new Set(alertTypes);
const PAGE_SIZE = 10;

export interface AlertState {
	alerts: AlertMessage[];
	hasMore: boolean;
	hasMoreBottom: boolean;
	hasMoreTop: boolean;
	isLoadingMore: boolean;
	isLoadingMoreBottom: boolean;
	isLoadingMoreTop: boolean;

	initAlerts: (logs: IncomingIPCMessage[]) => void;
	addAlerts: (logs: IncomingIPCMessage[]) => void;
	fetchMoreAlerts: () => Promise<void>;
	fetchMoreAlertsBottom: () => Promise<void>;
	fetchMoreAlertsTop: () => Promise<void>;
	loadAlertsAround: (timestamp: number) => Promise<boolean>;
}



const getItemKey = (item: AlertMessage) =>
	item.sequenceNumber != null
		? `${item.type}-${item.timestamp}-${item.sequenceNumber}`
		: `${item.type}-${item.timestamp}-${JSON.stringify(item.data)}`;

const filterItems = (logs: IncomingIPCMessage[]) => logs.filter(x => alertTypesSet.has(x.type as AlertType)) as AlertMessage[];

const mergeAndSortItems = (existing: AlertMessage[], incoming: AlertMessage[]) => {
	const map = new Map<string, AlertMessage>();
	for (const item of existing) {
		map.set(getItemKey(item), item);
	}
	for (const item of incoming) {
		map.set(getItemKey(item), item);
	}
	return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
};

export const useAlertStore = create<AlertState>((set, get) => ({
	alerts: [],
	hasMore: true,
	hasMoreBottom: true,
	hasMoreTop: false,
	isLoadingMore: false,
	isLoadingMoreBottom: false,
	isLoadingMoreTop: false,

	initAlerts: (logs) => set((state) => {
		const newItems = filterItems(logs);
		const alerts = mergeAndSortItems(state.alerts, newItems);
		const hasMore = newItems.length >= PAGE_SIZE;
		return {
			alerts,
			hasMore,
			hasMoreBottom: hasMore,
			hasMoreTop: false,
		};
	}),

	addAlerts: (logs) => set((state) => {
		const newItems = filterItems(logs);
		if (newItems.length === 0) return state;
		const alerts = mergeAndSortItems(state.alerts, newItems);
		return { alerts };
	}),

	fetchMoreAlerts: async () => {
		return get().fetchMoreAlertsBottom();
	},

	fetchMoreAlertsBottom: async () => {
		const { alerts, hasMoreBottom, isLoadingMoreBottom } = get();
		if (!hasMoreBottom || isLoadingMoreBottom) return;

		set({ isLoadingMore: true, isLoadingMoreBottom: true });
		try {
			const oldestTimestamp = alerts.length > 0 ? alerts.at(-1)!.timestamp : undefined;
			const logs = await window.electronAPI.getSecurityLogs({
				types: [...alertTypes],
				beforeTimestamp: oldestTimestamp,
				limit: PAGE_SIZE,
			});

			const newItems = filterItems(logs);
			const hasMore = logs.length >= PAGE_SIZE;
			set((state) => ({
				alerts: mergeAndSortItems(state.alerts, newItems),
				hasMore,
				hasMoreBottom: hasMore,
			}));
		} catch (err) {
			console.error("[useAlertStore] fetchMoreAlertsBottom failed:", err);
		} finally {
			set({ isLoadingMore: false, isLoadingMoreBottom: false });
		}
	},

	fetchMoreAlertsTop: async () => {
		const { alerts, hasMoreTop, isLoadingMoreTop } = get();
		if (!hasMoreTop || isLoadingMoreTop || alerts.length === 0) return;

		set({ isLoadingMoreTop: true });
		try {
			const newestTimestamp = alerts[0]?.timestamp;
			if (newestTimestamp === undefined) return;
			const logs = await window.electronAPI.getSecurityLogs({
				types: [...alertTypes],
				afterTimestamp: newestTimestamp,
				limit: PAGE_SIZE,
				direction: "newer",
			});

			const newItems = filterItems(logs);
			set((state) => ({
				alerts: mergeAndSortItems(state.alerts, newItems),
				hasMoreTop: logs.length >= PAGE_SIZE,
			}));
		} catch (err) {
			console.error("[useAlertStore] fetchMoreAlertsTop failed:", err);
		} finally {
			set({ isLoadingMoreTop: false });
		}
	},

	loadAlertsAround: async (timestamp: number) => {
		try {
			const result = await window.electronAPI.getSecurityLogsAround(timestamp, [...alertTypes], PAGE_SIZE);
			const newItems = filterItems(result.logs);
			if (newItems.length > 0) {
				set({
					alerts: newItems,
					hasMoreTop: result.hasMoreTop,
					hasMore: result.hasMoreBottom,
					hasMoreBottom: result.hasMoreBottom,
				});
				return true;
			}
			return false;
		} catch (err) {
			console.error("[useAlertStore] loadAlertsAround failed:", err);
			return false;
		}
	},
}));
