import type { ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { cn } from "@/lib/utils";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";



export interface AreaSeriesItem {
	dataKey: string;
	label?: string;
	color?: string;
	stackId?: string;
}

export interface ChartAreaInteractiveProps extends React.ComponentProps<typeof Card> {
	data: Record<string, unknown>[];
	config: ChartConfig;
	xAxisKey?: string;
	areas?: (string | AreaSeriesItem)[];
	heading?: ReactNode;
	description?: ReactNode;
	showLegend?: boolean;
	xAxisFormatter?: (value: unknown) => string;
	tooltipLabelFormatter?: (value: ReactNode, payload?: readonly unknown[]) => ReactNode;
	isLoading?: boolean;
	loadingText?: ReactNode;
}

const defaultStringFormatter = (value: unknown) => String(value ?? "");

export function ChartAreaInteractive({
	data,
	config,
	xAxisKey,
	areas,
	heading,
	description,
	showLegend = true,
	xAxisFormatter = defaultStringFormatter,
	tooltipLabelFormatter,
	isLoading,
	loadingText,
	className,
	children,
	...props
}: ChartAreaInteractiveProps) {
	// xAxisKey가 지정되지 않은 경우 데이터에서 config에 없는 첫 번째 키를 자동 감지
	const resolvedXAxisKey = (
		xAxisKey ?? (
			data.length > 0
				? Object.keys(data[0]!).find((key) => !config[key]) ?? Object.keys(data[0]!)[0]!
				: "date"
		)
	);



	const hasDataKey = (key: string) => data.some((item) => item[key] !== undefined);

	// areas가 명시되지 않은 경우 config에서 X축 키를 제외하고 실제 데이터에 존재하는 시리즈만 자동 추출
	const resolvedAreas: AreaSeriesItem[] = (
		areas && areas.length > 0
			? areas
				.map((item) =>
					typeof item === "string"
						? { dataKey: item, stackId: "a" }
						: { ...item, stackId: item.stackId ?? "a" },
				)
				.filter((item) => data.length === 0 || hasDataKey(item.dataKey))
			: Object.keys(config)
				.filter(
					(key) =>
						key !== resolvedXAxisKey &&
						config[key]?.label &&
						(data.length === 0 || hasDataKey(key)),
				)
				.map((key) => ({
					dataKey: key,
					stackId: "a",
				}))
	);

	return (
		<Card
			className={cn(
				"pt-0",
				className,
			)}
			{...props}
		>
			{(heading || description || children) && (
				<CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
					<div className="grid flex-1 gap-1">
						{heading && <CardTitle>{heading}</CardTitle>}
						{description && <CardDescription>{description}</CardDescription>}
					</div>
					{children}
				</CardHeader>
			)}
			<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
				{isLoading ? (
					<div className="flex items-center justify-center h-64 w-full text-sm text-muted-foreground font-medium">
						{loadingText ?? "Loading chart data..."}
					</div>
				) : (
					<ChartContainer
						config={config}
						className="aspect-auto h-64 w-full"
					>
						<AreaChart data={data}>
							<defs>
								{resolvedAreas.map((area) => {
									const color = area.color ?? `var(--color-${area.dataKey})`;

									return (
										<linearGradient
											key={area.dataKey}
											id={`fill-${area.dataKey}`}
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor={color}
												stopOpacity={0.8}
											/>
											<stop
												offset="95%"
												stopColor={color}
												stopOpacity={0.1}
											/>
										</linearGradient>
									);
								})}
							</defs>
							<CartesianGrid
								vertical={false}
							/>
							<XAxis
								dataKey={resolvedXAxisKey}
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								minTickGap={32}
								tickFormatter={xAxisFormatter}
							/>
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										labelFormatter={tooltipLabelFormatter}
										indicator="dot"
									/>
								}
							/>
							{resolvedAreas.map((area) => (
								<Area
									key={area.dataKey}
									dataKey={area.dataKey}
									type="natural"
									fill={`url(#fill-${area.dataKey})`}
									stroke={area.color ?? `var(--color-${area.dataKey})`}
									stackId={area.stackId}
								/>
							))}
							{showLegend && <ChartLegend content={<ChartLegendContent/>}/>}
						</AreaChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
