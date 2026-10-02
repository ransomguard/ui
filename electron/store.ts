import Store from "electron-store";



export const WINDOW_MIN_WIDTH = 800;
export const WINDOW_MIN_HEIGHT = 600;



export interface StoreData {
	language?: string;
	windowState: WindowState;
}

export interface WindowState {
	width: number;
	height: number;
	x?: number;
	y?: number;
	isMaximized?: boolean;
}



export const store = new Store<StoreData>({
	schema: {
		language: {
			type: "string",
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
