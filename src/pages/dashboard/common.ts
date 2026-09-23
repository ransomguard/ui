export interface TimeRangeItem {
	label: string;
	value: number;
}

export const timeRangeItems: [TimeRangeItem, ...TimeRangeItem[]] = [
	{
		label: "Last 3 months",
		value: 90,
	},
	{
		label: "Last 30 days",
		value: 30,
	},
	{
		label: "Last 7 days",
		value: 7,
	},
];
