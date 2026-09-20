import { useState, useMemo, useEffect } from "react";
import {
	Users,
	Monitor,
	Smartphone,
	TrendingUp,
} from "lucide-react";

import * as api from "@/lib/api";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartAreaInteractive, ChartStats, type MetricCardItem } from "@/components/chart";
import { DataTable, columns } from "@/components/data-table";



interface FilterItem {
	label: string;
	value: string;
}

const timeRangeItems: [FilterItem, ...FilterItem[]] = [
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



export default function Home() {
	const [timeRange, setTimeRange] = useState<FilterItem>(timeRangeItems[0]);
	const [allData, setAllData] = useState<api.AreaChartDataItem[]>([]);
	const [isChartLoading, setIsChartLoading] = useState(true);

	const [tableItems, setTableItems] = useState<api.TableDataItem[]>([]);
	const [isTableLoading, setIsTableLoading] = useState(true);

	const updateTimeRange = (value: FilterItem | null) => {
		setTimeRange(value ?? timeRangeItems[0]);
	};

	useEffect(() => {
		let isMounted = true;

		api.getAreaChartData().then((chartData) => {
			if (isMounted) {
				setAllData(chartData);
				setIsChartLoading(false);
			}
		});

		api.getTableData().then((data) => {
			if (isMounted) {
				setTableItems(data);
				setIsTableLoading(false);
			}
		});

		return () => {
			isMounted = false;
		};
	}, []);

	const filteredData = useMemo(() => {
		if (!allData.length) return [];

		// 마지막 날짜 기준으로 범위 필터링
		const lastItem = allData.at(-1)!;
		const referenceDate = new Date(lastItem.date);

		let daysToSubtract: number;
		switch (timeRange.value) {
			case "30d":
				daysToSubtract = 30;
				break;
			case "7d":
				daysToSubtract = 7;
				break;
			default:
				daysToSubtract = 90;
		}

		const startDate = new Date(referenceDate);
		startDate.setDate(startDate.getDate() - daysToSubtract);

		return allData.filter((item) => new Date(item.date) >= startDate);
	}, [allData, timeRange]);

	const statItems = useMemo<MetricCardItem[]>(() => {
		if (isChartLoading || filteredData.length === 0) {
			return [
				{
					label: "Total",
					description: "Total Visitors",
					icon: Users,
				},
				{
					label: "Desktop",
					description: "-% of total",
					icon: Monitor,
				},
				{
					label: "Mobile",
					description: "-% of total",
					icon: Smartphone,
				},
				{
					label: "Daily Average",
					description: "Average visitors per day",
					icon: TrendingUp,
				},
			];
		}

		const totalDesktop = filteredData.reduce((acc, cur) => acc + (Number(cur.desktop) || 0), 0);
		const totalMobile = filteredData.reduce((acc, cur) => acc + (Number(cur.mobile) || 0), 0);
		const totalVisitors = totalDesktop + totalMobile;
		const avgDaily = filteredData.length > 0 ? Math.round(totalVisitors / filteredData.length) : 0;
		const desktopPercent = totalVisitors > 0 ? Math.round((totalDesktop / totalVisitors) * 100) : 0;
		const mobilePercent = totalVisitors > 0 ? Math.round((totalMobile / totalVisitors) * 100) : 0;

		return [
			{
				label: "Total",
				value: totalVisitors.toLocaleString(),
				description: "Total Visitors",
				icon: Users,
			},
			{
				label: "Desktop",
				value: totalDesktop.toLocaleString(),
				description: `${desktopPercent}% of total`,
				icon: Monitor,
			},
			{
				label: "Mobile",
				value: totalMobile.toLocaleString(),
				description: `${mobilePercent}% of total`,
				icon: Smartphone,
			},
			{
				label: "Daily Average",
				value: avgDaily.toLocaleString(),
				description: "Average visitors per day",
				icon: TrendingUp,
			},
		];
	}, [filteredData, isChartLoading]);

	return (
		<div className="flex flex-col gap-6 min-w-0">
			{/* 수치 카드 컴포넌트 */}
			<ChartStats
				items={statItems}
				isLoading={isChartLoading}
			/>

			{/* Area 차트 */}
			<ChartAreaInteractive
				data={filteredData}
				config={chartConfig}
				xAxisKey="date"
				xAxisFormatter={formatDate}
				tooltipLabelFormatter={formatDate}
				heading="Area Chart"
				description={`Showing total visitors for the ${timeRange.label}`}
				isLoading={isChartLoading}
			>
				<Select value={timeRange} onValueChange={updateTimeRange}>
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

			{/* Data Table 섹션 */}
			<div className="space-y-3 min-w-0">
				<div>
					<h2 className="text-lg font-semibold tracking-tight">Data Table</h2>
				</div>
				<DataTable
					columns={columns}
					data={tableItems}
					onDataChange={setTableItems}
					isLoading={isTableLoading}
				/>
			</div>
		</div>
	);
}
