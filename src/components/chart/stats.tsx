import { cn } from "@/lib/utils";

import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";



export interface MetricCardItem {
	label: React.ReactNode;
	value?: React.ReactNode;
	description?: React.ReactNode;
	icon?: React.ComponentType<{ className?: string }>;
	action?: React.ReactNode;
	className?: string;
	isLoading?: boolean;
}

export function MetricCard({
	label,
	value,
	description,
	icon: Icon,
	action,
	className,
	isLoading,
}: MetricCardItem) {
	return (
		<Card size="sm" className={className}>
			<CardHeader>
				<CardDescription>{label}</CardDescription>
				<CardTitle className="font-bold">{isLoading || !value ? "-" : value}</CardTitle>
				{(Icon || action) && (
					<CardAction>
						{action ?? (Icon && <Icon className="size-4 text-muted-foreground"/>)}
					</CardAction>
				)}
			</CardHeader>
			{description && (
				<CardContent>
					<p className="text-xs text-muted-foreground">{description}</p>
				</CardContent>
			)}
		</Card>
	);
}



export interface ChartStatsProps {
	items: MetricCardItem[];
	className?: string;
	isLoading?: boolean;
}

export function ChartStats({
	items,
	className,
	isLoading,
}: ChartStatsProps) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
				className,
			)}
		>
			{items.map((item, index) => (
				<MetricCard
					key={typeof item.label === "string" ? item.label : index}
					{...item}
					isLoading={item.isLoading ?? isLoading}
				/>
			))}
		</div>
	);
}
