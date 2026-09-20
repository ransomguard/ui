import { useMemo } from "react";
import {
	Users,
	Monitor,
	Smartphone,
	TrendingUp,
} from "lucide-react";

import type * as api from "@/lib/api";

import { ChartStats, type MetricCardItem } from "@/components/chart/stats";



export interface StatsSectionProps {
	data: api.AreaChartDataItem[];
	isLoading?: boolean;
}

export default function StatsSection({ data, isLoading }: StatsSectionProps) {
	const statItems = useMemo<MetricCardItem[]>(() => {
		if (isLoading || data.length === 0) {
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

		const totalDesktop = data.reduce((acc, cur) => acc + (Number(cur.desktop) || 0), 0);
		const totalMobile = data.reduce((acc, cur) => acc + (Number(cur.mobile) || 0), 0);
		const totalVisitors = totalDesktop + totalMobile;
		const avgDaily = data.length > 0 ? Math.round(totalVisitors / data.length) : 0;
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
	}, [data, isLoading]);

	return (
		<ChartStats
			items={statItems}
			isLoading={isLoading}
		/>
	);
}
