import { useState, useEffect, lazy, Suspense } from "react";
import {
	Users,
	Monitor,
	Smartphone,
	TrendingUp,
} from "lucide-react";

import * as api from "@/lib/api";

import { Skeleton } from "@/components/ui/skeleton";

import { timeRangeItems, type TimeRangeItem } from "./common";
import type { StatsItem } from "./stats-section";



const StatsSection = lazy(() => import("./stats-section"));
const MainChartSection = lazy(() => import("./main-chart-section"));
const IpBlockSection = lazy(() => import("./ip-block-section"));



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

function IpBlockFallback() {
	return (
		<div className="space-y-3 min-w-0">
			<Skeleton className="h-6 w-36 rounded"/>
			<Skeleton className="h-64 w-full rounded-xl"/>
		</div>
	);
}



export default function Dashboard() {
	const [timeRange, setTimeRange] = useState<TimeRangeItem>(timeRangeItems[0]);
	const [chartItems, setChartItems] = useState<api.AreaChartDataItem[]>([]);
	const [isChartLoading, setIsChartLoading] = useState(true);
	const updateTimeRange = (value: TimeRangeItem | null) => {
		setTimeRange(value ?? timeRangeItems[0]);
	};

	const [blockedItems, setBlockedItems] = useState<api.BlockedIpItem[]>([]);
	const [isBlockedLoading, setIsBlockedLoading] = useState(true);
	const addBlockedItem = (value: api.BlockedIpItem | null) => {
		if (value) {
			setBlockedItems((prev) => [value, ...prev]);
		}
	};
	const removeBlockedItem = (value: api.BlockedIpItem | null) => {
		if (value) {
			setBlockedItems((prev) => prev.filter((item) => item.id !== value.id));
		}
	};

	let filteredChartData: api.AreaChartDataItem[] = [];
	if (chartItems.length) {
		// 마지막 날짜 기준으로 범위 필터링
		const lastItem = chartItems.at(-1)!;
		const daysToSubtract = timeRange.value;

		const startDate = new Date(lastItem.date);
		startDate.setDate(startDate.getDate() - daysToSubtract);

		filteredChartData = chartItems.filter((item) => new Date(item.date) >= startDate);
	}

	useEffect(() => {
		let isMounted = true;

		api.getMainChartData().then((data) => {
			if (isMounted) {
				setChartItems(data);
				setIsChartLoading(false);
			}
		});

		api.getBlockedIpData().then((data) => {
			if (isMounted) {
				setBlockedItems(data);
				setIsBlockedLoading(false);
			}
		});

		return () => {
			isMounted = false;
		};
	}, []);

	

	const isChartReady = !isChartLoading && filteredChartData.length > 0;
	const { totalDesktop, totalMobile } = isChartReady
		? filteredChartData.reduce(
			(acc, cur) => {
				acc.totalDesktop += Number(cur.desktop) || 0;
				acc.totalMobile += Number(cur.mobile) || 0;
				return acc;
			},
			{ totalDesktop: 0, totalMobile: 0 }
		)
		: { totalDesktop: 0, totalMobile: 0 };

	const totalVisitors = totalDesktop + totalMobile;
	const avgDaily = filteredChartData.length > 0 ? Math.round(totalVisitors / filteredChartData.length) : 0;
	const desktopPercent = totalVisitors > 0 ? Math.round((totalDesktop / totalVisitors) * 100) : 0;
	const mobilePercent = totalVisitors > 0 ? Math.round((totalMobile / totalVisitors) * 100) : 0;

	const statsItems: StatsItem[] = [
		{
			icon: Users,
			label: "total",
			description: "totalVisitors",
			...(isChartReady && { value: totalVisitors.toLocaleString() }),
		},
		{
			icon: Monitor,
			label: "desktop",
			description: "desktopVisitors",
			i18nContext: {
				percent: isChartReady ? desktopPercent : "-",
			},
			...(isChartReady && { value: totalDesktop.toLocaleString() }),
		},
		{
			icon: Smartphone,
			label: "mobile",
			description: "mobileVisitors",
			i18nContext: {
				percent: isChartReady ? mobilePercent : "-",
			},
			...(isChartReady && { value: totalMobile.toLocaleString() }),
		},
		{
			icon: TrendingUp,
			label: "dailyAverage",
			description: "avgVisitorsPerDay",
			...(isChartReady && { value: avgDaily.toLocaleString() }),
		},
	];

	return (
		<div className="flex flex-col gap-6 min-w-0">
			{/* 수치 카드 섹션 */}
			<Suspense fallback={<StatsFallback/>}>
				<StatsSection
					items={statsItems}
					isLoading={isChartLoading}
				/>
			</Suspense>

			{/* Area 차트 섹션 */}
			<Suspense fallback={<ChartFallback/>}>
				<MainChartSection
					data={filteredChartData}
					timeRange={timeRange}
					timeRangeItems={timeRangeItems}
					onTimeRangeChange={updateTimeRange}
					isLoading={isChartLoading}
				/>
			</Suspense>

			{/* IP 차단 목록 관리 섹션 */}
			<Suspense fallback={<IpBlockFallback/>}>
				<IpBlockSection
					data={blockedItems}
					addItem={addBlockedItem}
					removeItem={removeBlockedItem}
					isLoading={isBlockedLoading}
				/>
			</Suspense>
		</div>
	);
}
