import { useTranslation } from "react-i18next";

import type { FlattenedKeys } from "@/locales";
import { cn } from "@/lib/utils";

import { MetricCard, type MetricCardItem } from "@/components/chart/stats";



export interface StatsItem extends MetricCardItem {
	label: FlattenedKeys<"stats">;
	description?: FlattenedKeys<"stats">;
	i18nContext?: Record<string, unknown>;
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
	const { t } = useTranslation();

	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
				className,
			)}
			{...props}
		>
			{items.map(({ i18nContext, ...item }, index) => (
				<MetricCard
					key={index}
					{...item}
					label={t($ => $.stats[item.label])}
					description={!item.description ? undefined : t($ => $.stats[item.description!], i18nContext)}
					isLoading={item.isLoading ?? isLoading}
				/>
			))}
		</div>
	);
}
