import { useTranslation } from "react-i18next";

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
	const { t, i18n: { language } } = useTranslation();

	const getLabel = (item: T) => t($ => $.timeRange[item.label]);

	const chartConfig = {
		visitors: {
			label: t($ => $.chart.visitors),
		},
		desktop: {
			label: t($ => $.chart.desktop),
			color: "var(--chart-1)",
		},
		mobile: {
			label: t($ => $.chart.mobile),
			color: "var(--chart-2)",
		},
	} satisfies ChartConfig;

	const formatDate = (value: unknown) => {
		const date = new Date(String(value));
		if (Number.isNaN(date.getTime())) {
			return String(value ?? "");
		}
		return date.toLocaleDateString(language, {
			month: "short",
			day: "numeric",
		});
	};

	return (
		<ChartAreaInteractive
			data={data}
			config={chartConfig}
			heading={t($ => $.chart.heading)}
			description={t($ => $.chart.description, { timeRange: getLabel(timeRange) })}
			xAxisKey="date"
			xAxisFormatter={formatDate}
			tooltipLabelFormatter={formatDate}
			isLoading={isLoading}
		>
			<Select
				value={timeRange}
				onValueChange={onTimeRangeChange}
				itemToStringLabel={getLabel}
			>
				<SelectTrigger
					className="hidden w-40 rounded-lg sm:ml-auto sm:flex"
					aria-label="Select a value"
				>
					<SelectValue placeholder={t($ => $.timeRange.last90Days)}/>
				</SelectTrigger>
				<SelectContent className="rounded-xl">
					<SelectGroup>
						{timeRangeItems.map(item => (
							<SelectItem
								key={item.value}
								value={item}
								className="rounded-lg"
							>
								{getLabel(item)}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</ChartAreaInteractive>
	);
}
