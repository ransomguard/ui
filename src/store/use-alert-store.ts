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
	isLoadingMore: boolean;

	initAlerts: (logs: IncomingIPCMessage[]) => void;
	addAlerts: (logs: IncomingIPCMessage[]) => void;
	fetchMoreAlerts: () => Promise<void>;
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
	isLoadingMore: false,

	initAlerts: (logs) => set((state) => {
		const newItems = filterItems(logs);
		const alerts = mergeAndSortItems(state.alerts, newItems);
		return { alerts, hasMore: newItems.length >= PAGE_SIZE };
	}),

	addAlerts: (logs) => set((state) => {
		const newItems = filterItems(logs);
		if (newItems.length === 0) return state;
		const alerts = mergeAndSortItems(state.alerts, newItems);
		return { alerts };
	}),

	fetchMoreAlerts: async () => {
		const { alerts, hasMore, isLoadingMore } = get();
		if (!hasMore || isLoadingMore) return;

		set({ isLoadingMore: true });
		try {
			const oldestTimestamp = alerts.length > 0 ? alerts.at(-1)!.timestamp : undefined;
			const logs = await window.electronAPI.getSecurityLogs({
				types: [...alertTypes],
				beforeTimestamp: oldestTimestamp,
				limit: PAGE_SIZE,
			});

			const newItems = filterItems(logs);
			set((state) => ({
				alerts: mergeAndSortItems(state.alerts, newItems),
				hasMore: logs.length >= PAGE_SIZE,
			}));
		} catch (err) {
			console.error("[useAlertStore] fetchMoreAlerts failed:", err);
		} finally {
			set({ isLoadingMore: false });
		}
	},
}));
