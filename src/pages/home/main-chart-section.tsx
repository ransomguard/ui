import type * as api from "@/lib/api";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartAreaInteractive } from "@/components/chart/area";

import { timeRangeItems, type FilterItem } from "./common";



const chartConfig = {
	visitors: {
		label: "Visitors",
	},
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)",
	},
	mobile: {
		label: "Mobile",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

const formatDate = (value: unknown) => {
	const date = new Date(String(value));
	if (Number.isNaN(date.getTime())) {
		return String(value ?? "");
	}
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
};



export interface MainChartSectionProps {
	data: api.AreaChartDataItem[];
	timeRange: FilterItem;
	onTimeRangeChange: (value: FilterItem | null) => void;
	isLoading?: boolean;
}

export default function MainChartSection({
	data,
	timeRange,
	onTimeRangeChange,
	isLoading,
}: MainChartSectionProps) {
	return (
		<ChartAreaInteractive
			data={data}
			config={chartConfig}
			xAxisKey="date"
			xAxisFormatter={formatDate}
			tooltipLabelFormatter={formatDate}
			heading="Area Chart"
			description={`Showing total visitors for the ${timeRange.label}`}
			isLoading={isLoading}
		>
			<Select value={timeRange} onValueChange={onTimeRangeChange}>
				<SelectTrigger
					className="hidden w-40 rounded-lg sm:ml-auto sm:flex"
					aria-label="Select a value"
				>
					<SelectValue placeholder="Last 3 months"/>
				</SelectTrigger>
				<SelectContent className="rounded-xl">
					<SelectGroup>
						{timeRangeItems.map(item => (
							<SelectItem
								key={item.value}
								value={item}
								className="rounded-lg"
							>
								{item.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</ChartAreaInteractive>
	);
}
