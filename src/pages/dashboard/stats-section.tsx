import { cn } from "@/lib/utils";

import { MetricCard, type MetricCardItem } from "@/components/chart/stats";



export interface StatsItem extends MetricCardItem {
}

export interface StatsSectionProps extends React.ComponentProps<"div"> {
	items: StatsItem[];
	isLoading?: boolean;
}

export default function StatsSection({
	items,
	isLoading,
	className,
	...props
}: StatsSectionProps) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
				className,
			)}
			{...props}
		>
			{items.map((item, index) => (
				<MetricCard
					key={index}
					{...item}
					isLoading={item.isLoading ?? isLoading}
				/>
			))}
		</div>
	);
}
