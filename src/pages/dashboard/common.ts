import type { FlattenedKeys } from "@/locales";



export interface TimeRangeItem {
	label: FlattenedKeys<"timeRange">;
	value: number;
}

export const timeRangeItems: [TimeRangeItem, ...TimeRangeItem[]] = [
	{
		label: "last90Days",
		value: 90,
	},
	{
		label: "last30Days",
		value: 30,
	},
	{
		label: "last7Days",
		value: 7,
	},
];
