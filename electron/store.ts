import os from "node:os";
import electron from "electron";
import Store from "electron-store";



export const WINDOW_MIN_WIDTH = 800;
export const WINDOW_MIN_HEIGHT = 600;



export interface StoreData {
 programDisplayNames?: Record<string, string>;
	language?: string;
	windowState: WindowState;
	lastAcknowledgedThreatId?: number;
	lastAcknowledgedThreatTime?: number;
	dashboardTimeRangeDays?: number;
}

export interface WindowState {
	width: number;
	height: number;
	x?: number;
	y?: number;
	isMaximized?: boolean;
}



export const language = {
	set: (lang: string) => store.set("language", lang),
	get: () => store.get("language") ?? electron.app?.getLocale() ?? "ko",
};

export const acknowledgedThreat = {
	set: (id: number, timestamp = Date.now()) => {
		store.set("lastAcknowledgedThreatId", id);
		store.set("lastAcknowledgedThreatTime", timestamp);
	},
	get: () => ({
		lastId: store.get("lastAcknowledgedThreatId") ?? 0,
		lastTime: store.get("lastAcknowledgedThreatTime") ?? 0,
	}),
};

export const dashboardTimeRange = {
	set: (days: number) => store.set("dashboardTimeRangeDays", days),
	get: () => store.get("dashboardTimeRangeDays"),
};

const getStoreCwd = () => {
	if (!process.versions.electron) {
		return os.tmpdir();
	}
	return electron.app?.isPackaged ? undefined : electron.app?.getAppPath();
};

export const store = new Store<StoreData>({
	cwd: getStoreCwd(),
	schema: {
  programDisplayNames: {type: "object", default: {}, additionalProperties: {type: "string", maxLength: 80}},
		language: {
			type: "string",
		},
		lastAcknowledgedThreatId: {
			type: "number",
			default: 0,
		},
		lastAcknowledgedThreatTime: {
			type: "number",
			default: 0,
		},
		dashboardTimeRangeDays: {
			type: "number",
		},
		windowState: {
			type: "object",
			default: {
				width: 1200,
				height: 800,
				isMaximized: false,
			},
			properties: {
				width: {
					type: "number",
					minimum: WINDOW_MIN_WIDTH,
					default: 1200,
				},
				height: {
					type: "number",
					minimum: WINDOW_MIN_HEIGHT,
					default: 800,
				},
				x: {
					type: "number",
				},
				y: {
					type: "number",
				},
				isMaximized: {
					type: "boolean",
					default: false,
				},
			},
		},
	},
});
