import { useState, useMemo, useEffect, lazy, Suspense } from "react";

import * as api from "@/lib/api";

import { Skeleton } from "@/components/ui/skeleton";

import { timeRangeItems, type FilterItem } from "./common";



const StatsSection = lazy(() => import("./stats-section"));
const MainChartSection = lazy(() => import("./main-chart-section"));
const MainTableSection = lazy(() => import("./main-table-section"));



function StatsFallback() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<Skeleton key={i} className="h-28 rounded-xl"/>
			))}
		</div>
	);
}

function ChartFallback() {
	return (
		<Skeleton className="relative h-96 w-full rounded-xl"/>
	);
}

function TableFallback() {
	return (
		<div className="space-y-3 min-w-0">
			<Skeleton className="h-6 w-28 rounded"/>
			<Skeleton className="h-96 w-full rounded-xl"/>
		</div>
	);
}



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

	return (
		<div className="flex flex-col gap-6 min-w-0">
			{/* 수치 카드 섹션 */}
			<Suspense fallback={<StatsFallback/>}>
				<StatsSection
					data={filteredData}
					isLoading={isChartLoading}
				/>
			</Suspense>

			{/* Area 차트 섹션 */}
			<Suspense fallback={<ChartFallback/>}>
				<MainChartSection
					data={filteredData}
					timeRange={timeRange}
					onTimeRangeChange={updateTimeRange}
					isLoading={isChartLoading}
				/>
			</Suspense>

			{/* Data Table 섹션 */}
			<Suspense fallback={<TableFallback/>}>
				<MainTableSection
					data={tableItems}
					onDataChange={setTableItems}
					isLoading={isTableLoading}
				/>
			</Suspense>
		</div>
	);
}
