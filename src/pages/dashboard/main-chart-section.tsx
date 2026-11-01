import { useTranslation } from "react-i18next";
import { useSearchParamTab } from "@/hooks/use-search-param-tab";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartAreaInteractive } from "@/components/chart/area";
import type { ChartConfig } from "@/components/ui/chart";

import type { TimeRangeItem } from "./common";



export type ChartMetricKey =
	| "threat"
	| "processTerminated"
	| "recovery"
	| "fileRename"
	| "fileWrite"
	| "processCreate"
	| "firewall"
	| "queueDepth"
	| "eventsDropped";

export interface AreaChartDataItem extends Record<string, unknown> {
	date: string;
	threat: number;
	processTerminated: number;
	recovery: number;
	fileRename: number;
	fileWrite: number;
	processCreate: number;
	firewall: number;
	queueDepth: number;
	eventsDropped: number;
}

export type ChartCategory = "threat" | "telemetry" | "health" | "all";

const CATEGORY_SERIES_MAP: Record<ChartCategory, ChartMetricKey[]> = {
	threat: ["threat", "processTerminated", "recovery", "fileRename"],
	telemetry: ["fileWrite", "processCreate", "firewall"],
	health: ["queueDepth", "eventsDropped"],
	all: [
		"threat",
		"processTerminated",
		"recovery",
		"fileRename",
		"fileWrite",
		"processCreate",
		"firewall",
		"queueDepth",
		"eventsDropped",
	],
};

export interface MainChartSectionProps<T extends TimeRangeItem> {
	data: AreaChartDataItem[];
	timeRange: T;
	timeRangeItems: T[];
	onTimeRangeChange: (value: T | null) => void;
	isLoading?: boolean;
}



const getFormatDate = (language: string) => (value: unknown) => {
	const date = new Date(String(value));
	if (Number.isNaN(date.getTime())) {
		return String(value ?? "");
	}
	return date.toLocaleDateString(language, {
		month: "short",
		day: "numeric",
	});
};

export default function MainChartSection<T extends TimeRangeItem>({
	data,
	timeRange,
	timeRangeItems,
	onTimeRangeChange,
	isLoading,
}: MainChartSectionProps<T>) {
	const { t, i18n: { language } } = useTranslation();
	const [activeCategory, setActiveCategory] = useSearchParamTab<ChartCategory>({
		paramName: "chartTab",
		defaultTab: "threat",
		validTabs: ["threat", "telemetry", "health", "all"] as const,
	});

	const getLabel = (item: T) => t($ => $.timeRange[item.label], { days: item.value });

	const chartConfig = {
		visitors: {
			label: t($ => $.chart.visitors),
		},
		threat: {
			label: t($ => $.chart.threat),
			color: "var(--color-rose-500)",
		},
		processTerminated: {
			label: t($ => $.chart.processTerminated),
			color: "var(--color-orange-500)",
		},
		recovery: {
			label: t($ => $.chart.recovery),
			color: "var(--color-emerald-500)",
		},
		fileRename: {
			label: t($ => $.chart.fileRename),
			color: "var(--color-amber-500)",
		},
		fileWrite: {
			label: t($ => $.chart.fileWrite),
			color: "var(--color-sky-500)",
		},
		processCreate: {
			label: t($ => $.chart.processCreate),
			color: "var(--color-indigo-500)",
		},
		firewall: {
			label: t($ => $.chart.firewall),
			color: "var(--color-purple-500)",
		},
		queueDepth: {
			label: t($ => $.chart.queueDepth),
			color: "var(--color-teal-500)",
		},
		eventsDropped: {
			label: t($ => $.chart.eventsDropped),
			color: "var(--color-red-600)",
		},
	} satisfies ChartConfig;

	const activeAreas = CATEGORY_SERIES_MAP[activeCategory];

	return (
		<ChartAreaInteractive
			data={data}
			config={chartConfig}
			areas={activeAreas}
			heading={t($ => $.chart.heading)}
			description={t($ => $.chart.description, { timeRange: getLabel(timeRange) })}
			xAxisKey="date"
			xAxisFormatter={getFormatDate(language)}
			isLoading={isLoading}
		>
			<div className="flex flex-wrap items-center gap-2 sm:ml-auto">
				{/* 지표 카테고리 필터 탭 */}
				<Tabs
					value={activeCategory}
					onValueChange={(val) => setActiveCategory((val as ChartCategory) ?? "threat")}
				>
					<TabsList className="h-9">
						<TabsTrigger value="threat" className="text-xs px-2.5">
							{t($ => $.chart.tabs.threat)}
						</TabsTrigger>
						<TabsTrigger value="telemetry" className="text-xs px-2.5">
							{t($ => $.chart.tabs.telemetry)}
						</TabsTrigger>
						<TabsTrigger value="health" className="text-xs px-2.5">
							{t($ => $.chart.tabs.health)}
						</TabsTrigger>
						<TabsTrigger value="all" className="text-xs px-2.5">
							{t($ => $.chart.tabs.all)}
						</TabsTrigger>
					</TabsList>
				</Tabs>

				{/* 기간 선택 드롭다운 */}
				<Select
					value={timeRange}
					onValueChange={onTimeRangeChange}
					itemToStringLabel={getLabel}
				>
					<SelectTrigger
						className="w-36 rounded-lg text-xs h-9"
						aria-label="Select a value"
					>
						<SelectValue placeholder={getLabel(timeRange)}/>
					</SelectTrigger>
					<SelectContent className="rounded-xl">
						<SelectGroup>
							{timeRangeItems.map(item => (
								<SelectItem
									key={item.value}
									value={item}
									className="rounded-lg text-xs"
								>
									{getLabel(item)}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
		</ChartAreaInteractive>
	);
}
