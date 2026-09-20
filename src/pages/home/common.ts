export interface FilterItem {
	label: string;
	value: string;
}

export const timeRangeItems: [FilterItem, ...FilterItem[]] = [
	{
		label: "Last 3 months",
		value: "90d",
	},
	{
		label: "Last 30 days",
		value: "30d",
	},
	{
		label: "Last 7 days",
		value: "7d",
	},
];
