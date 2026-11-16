import type { FlattenedKeys } from "@/locales";
import type { StringToMsValue } from "@/lib/time";



export interface TimeRangeItem {
	default?: boolean;
	label: FlattenedKeys<"timeRange">;
	value: number;
	interval: StringToMsValue;
}

export const timeRangeItems: [TimeRangeItem, ...TimeRangeItem[]] = [
	{
		label: "lastDays",
		value: 90,
		interval: "1d",
	},
	{
		label: "lastDays",
		value: 60,
		interval: "1d",
	},
	{
		label: "lastDays",
		value: 30,
		interval: "8h",
	},
	{
		label: "lastDays",
		value: 15,
		interval: "4h",
	},
	{
		default: true,
		label: "lastDays",
		value: 7,
		interval: "2h",
	},
	{
		label: "lastDay",
		value: 1,
		interval: "15m",
	},
];
