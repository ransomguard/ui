import { cn } from "@/lib/utils";

import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";



export interface MetricCardItem extends React.ComponentProps<typeof Card> {
	label: React.ReactNode;
	value?: React.ReactNode;
	description?: React.ReactNode;
	icon?: React.ComponentType<{ className?: string }>;
	action?: React.ReactNode;
	isLoading?: boolean;
}

export function MetricCard({
	label,
	value,
	description,
	icon: Icon,
	action,
	isLoading,
	color,
	style,
	className,
	...props
}: MetricCardItem) {
	return (
		<Card
			size="sm"
			className={cn(
				"ring-(--color)/30 text-(--color)",
				className,
			)}
			style={{
				"--color": color ?? "var(--foreground)",
				...style,
			} as React.CSSProperties}
			{...props}
		>
			<CardHeader>
				<CardDescription>{label}</CardDescription>
				<CardTitle className="font-bold">{isLoading || !value ? "-" : value}</CardTitle>
				{(Icon || action) && (
					<CardAction>
						{action ?? (Icon && <Icon className="size-4 opacity-70"/>)}
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
