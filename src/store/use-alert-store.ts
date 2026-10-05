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

export interface AlertState {
	alerts: AlertMessage[];
	initAlerts: (logs: IncomingIPCMessage[]) => void;
	addAlerts: (logs: IncomingIPCMessage[]) => void;
}



const filterItems = (logs: IncomingIPCMessage[]) => logs.filter(x => alertTypesSet.has(x.type as AlertType)) as AlertMessage[];
const sortItems = (logs: AlertMessage[]) => logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 200);

export const useAlertStore = create<AlertState>((set) => ({
	alerts: [],
	initAlerts: (logs) => set(() => {
		const newItems = filterItems(logs);
		const alerts = sortItems(newItems);
		return { alerts };
	}),
	addAlerts: (logs) => set((state) => {
		const newItems = filterItems(logs);
		const combined = [...newItems, ...state.alerts];
		const alerts = sortItems(combined);
		return { alerts };
	}),
}));
