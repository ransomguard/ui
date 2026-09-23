import type * as api from "@/lib/api";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ChartAreaInteractive } from "@/components/chart/area";
import type { ChartConfig } from "@/components/ui/chart";

import type { TimeRangeItem } from "./common";



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



export interface MainChartSectionProps<T extends TimeRangeItem> {
	data: api.AreaChartDataItem[];
	timeRange: T;
	timeRangeItems: T[];
	onTimeRangeChange: (value: T | null) => void;
	isLoading?: boolean;
}

export default function MainChartSection<T extends TimeRangeItem>({
	data,
	timeRange,
	timeRangeItems,
	onTimeRangeChange,
	isLoading,
}: MainChartSectionProps<T>) {
	return (
		<ChartAreaInteractive
			data={data}
			config={chartConfig}
			heading="Area Chart"
			description={`Showing total visitors for the ${timeRange.label}`}
			xAxisKey="date"
			xAxisFormatter={formatDate}
			tooltipLabelFormatter={formatDate}
			isLoading={isLoading}
		>
			<Select
				value={timeRange}
				onValueChange={onTimeRangeChange}
			>
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
