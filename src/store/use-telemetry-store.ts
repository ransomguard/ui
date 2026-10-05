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

export interface TelemetryState {
	events: TelemetryMessage[];
	initEvents: (logs: IncomingIPCMessage[]) => void;
	addEvents: (logs: IncomingIPCMessage[]) => void;
}



const filterItems = (logs: IncomingIPCMessage[]) => logs.filter(x => telemetryTypesSet.has(x.type as TelemetryType)) as TelemetryMessage[];
const sortItems = (logs: TelemetryMessage[]) => logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 200);

export const useTelemetryStore = create<TelemetryState>((set) => ({
	events: [],
	initEvents: (logs) => set(() => {
		const newItems = filterItems(logs);
		const events = sortItems(newItems);
		return { events };
	}),
	addEvents: (logs) => set((state) => {
		const newItems = filterItems(logs);
		const combined = [...newItems, ...state.events];
		const events = sortItems(combined);
		return { events };
	}),
}));
