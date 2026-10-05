import type { FlattenedKeys } from "@/locales";



export interface TimeRangeItem {
	label: FlattenedKeys<"timeRange">;
	value: number;
}

export const timeRangeItems: [TimeRangeItem, ...TimeRangeItem[]] = [
	{
		label: "lastDays",
		value: 90,
	},
	{
		label: "lastDays",
		value: 60,
	},
	{
		label: "lastDays",
		value: 30,
	},
	{
		label: "lastDays",
		value: 15,
	},
	{
		label: "lastDays",
		value: 7,
	},
	{
		label: "lastDay",
		value: 1,
	},
];
