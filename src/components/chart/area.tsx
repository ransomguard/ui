import { useMemo, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
	stacked?: boolean;
	heading?: ReactNode;
	description?: ReactNode;
	showLegend?: boolean;
	showYAxis?: boolean;
	xAxisFormatter?: (value: unknown) => string;
	yAxisFormatter?: (value: unknown) => string;
	isLoading?: boolean;
	loadingText?: ReactNode;
}

const defaultStringFormatter = (value: unknown) => String(value ?? "");

const defaultYAxisFormatter = (value: unknown): string => {
	const num = Number(value);
	if (Number.isNaN(num)) return String(value ?? "");
	if (num >= 1_000_000) {
		const formatted = (num / 1_000_000).toFixed(1);
		return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}M`;
	}
	if (num >= 10_000) {
		const formatted = (num / 1_000).toFixed(1);
		return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}k`;
	}
	return num.toLocaleString();
};

export function ChartAreaInteractive({
	data,
	config,
	xAxisKey,
	areas,
	stacked = true,
	heading,
	description,
	showLegend = true,
	showYAxis = true,
	xAxisFormatter = defaultStringFormatter,
	yAxisFormatter,
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

	const defaultStackId = stacked ? "a" : undefined;
	const hasDataKey = (key: string) => data.some((item) => item[key] !== undefined);

	// areas가 명시되지 않은 경우 config에서 X축 키를 제외하고 실제 데이터에 존재하는 시리즈만 자동 추출
	const resolvedAreas: AreaSeriesItem[] = (
		areas && areas.length > 0
			? areas
				.map((item) =>
					typeof item === "string"
						? { dataKey: item, stackId: defaultStackId }
						: { ...item, stackId: item.stackId ?? defaultStackId },
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
					stackId: defaultStackId,
				}))
	);

	const activeYAxisFormatter = yAxisFormatter ?? defaultYAxisFormatter;

	// 최대 수치를 계산하여 Y축 너비를 동적으로 자동 조절 (수치가 커져도 앞자리 짤림 방지)
	const maxValue = useMemo(() => {
		if (data.length === 0 || resolvedAreas.length === 0) return 0;

		return data.reduce((max, row) => {
			if (stacked) {
				const sum = resolvedAreas.reduce((acc, area) => {
					const val = Number(row[area.dataKey]) || 0;
					return acc + val;
				}, 0);
				return Math.max(max, sum);
			}

			const rowMax = resolvedAreas.reduce((acc, area) => {
				const val = Number(row[area.dataKey]) || 0;
				return Math.max(acc, val);
			}, 0);
			return Math.max(max, rowMax);
		}, 0);
	}, [data, resolvedAreas, stacked]);

	const yAxisMax = useMemo(() => {
		if (!Number.isFinite(maxValue) || maxValue <= 0) return 5;
		return Math.ceil(maxValue * 1.1);
	}, [maxValue]);

	const yAxisTicks = useMemo(() => {
		if (maxValue <= 0) {
			return [0, 1, 2, 3, 4, 5];
		}
		return undefined;
	}, [maxValue]);

	const dynamicYAxisWidth = useMemo(() => {
		if (!showYAxis) return 0;
		// 수치가 0이어도 기본 최소 눈금(yAxisMax)을 고려하여 너비 확보
		const sampleText = activeYAxisFormatter(yAxisMax);
		return Math.max(38, Math.ceil(sampleText.length * 8 + 16));
	}, [showYAxis, yAxisMax, activeYAxisFormatter]);

	return (
		<Card
			className={cn(
				"pt-0",
				className,
			)}
			{...props}
		>
			{(heading || description || children) && (
				<CardHeader className="flex flex-col gap-3 border-b py-5 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
					<div className="grid flex-1 gap-1">
						{heading && <CardTitle>{heading}</CardTitle>}
						{description && <CardDescription>{description}</CardDescription>}
					</div>
					{children}
				</CardHeader>
			)}
			<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
				{isLoading ? (
					<div className="flex items-center justify-center h-72 w-full text-sm text-muted-foreground font-medium">
						{loadingText ?? "Loading chart data..."}
					</div>
				) : (
					<ChartContainer
						config={config}
						className="aspect-auto h-72 w-full"
					>
						<AreaChart data={data} margin={{ top: 12, left: 0, right: 12, bottom: 0 }}>
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
								horizontal={true}
								strokeDasharray="3 3"
							/>
							<XAxis
								dataKey={resolvedXAxisKey}
								tickLine={true}
								axisLine={{ stroke: "var(--border)" }}
								tickMargin={8}
								minTickGap={32}
								tickFormatter={xAxisFormatter}
							/>
							{showYAxis && (
								<YAxis
									tickLine={true}
									axisLine={{ stroke: "var(--border)" }}
									tickMargin={6}
									width={dynamicYAxisWidth}
									allowDecimals={false}
									allowDataOverflow={true}
									domain={[0, yAxisMax]}
									ticks={yAxisTicks}
									tickFormatter={activeYAxisFormatter}
								/>
							)}
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										indicator="dot"
										className="**:[.flex-1]:gap-1.5"
									/>
								}
							/>
							{resolvedAreas.map((area) => (
								<Area
									key={area.dataKey}
									dataKey={area.dataKey}
									type="monotone"
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
