import { EventExplanation } from "@/components/event-explanation";
import { eventDisplayId } from "~/services/event-explanation";
import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import {
	Activity,
	Terminal,
	Clock,
	HardDrive,
	Shield,
	FileText,
} from "lucide-react";

import { useTelemetryStore, type TelemetryMessage } from "@/store";
import { useBidirectionalInfiniteScroll } from "@/hooks/use-bidirectional-infinite-scroll";

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable, type DataTableFeatures } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { I18n } from "@/components/i18n";



export interface TelemetryRow {
	id: string;
	createdAt: string;
	action: string;
	processId: number | string;
	processName: string;
	imagePath: string;
	source: string;
	matchedRule?: string;
	details: string;
	rawItem: TelemetryMessage;
}



const columnHelper = createColumnHelper<DataTableFeatures, TelemetryRow>();

const columns: ColumnDef<DataTableFeatures, TelemetryRow>[] = columnHelper.columns([
	{
		accessorKey: "createdAt",
		header: () => <I18n i18nKey="telemetry.columns.createdAt"/>,
		cell: ({ row }) => (
			<span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
				{row.original.createdAt}
			</span>
		),
	},
	{
		accessorKey: "action",
		header: () => <I18n i18nKey="telemetry.columns.action"/>,
		cell: ({ row }) => {
			const action = row.original.action;
			let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

			if (action === "BLOCKED" || action === "TERMINATED") {
				variant = "destructive";
			} else if (action === "PROCESS_CREATE" || action === "AUDIT") {
				variant = "secondary";
			} else if (action === "FILE_WRITE" || action === "FILE_RENAME") {
				variant = "default";
			}

			return <Badge variant={variant} className="text-[11px] px-2 py-0.5">{action}</Badge>;
		},
	},
	{
		accessorKey: "processId",
		header: () => <I18n i18nKey="telemetry.columns.processId"/>,
		cell: ({ row }) => (
			<span className="font-mono text-xs font-medium">
				{row.original.processId}
			</span>
		),
	},
	{
		accessorKey: "processName",
		header: () => <I18n i18nKey="telemetry.columns.processName"/>,
		cell: ({ row }) => (
			<span className="font-medium text-foreground">
				{row.original.processName}
			</span>
		),
	},
	{
		accessorKey: "imagePath",
		header: () => <I18n i18nKey="telemetry.columns.imagePath"/>,
		cell: ({ row }) => (
			<span className="font-mono text-xs text-muted-foreground truncate max-w-md block">
				{row.original.imagePath}
			</span>
		),
	},
	{
		accessorKey: "source",
		header: () => <I18n i18nKey="telemetry.columns.source"/>,
		cell: ({ row }) => (
			<span className="text-xs text-muted-foreground">
				{row.original.source}
			</span>
		),
	},
]);

export default function TelemetryPage() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const timestampParam = searchParams.get("timestamp");
	const targetTimestamp = timestampParam ? Number(timestampParam) : undefined;
	const targetItemKey = searchParams.get("itemKey") || searchParams.get("highlightId") || undefined;

	const events = useTelemetryStore((state) => state.events);
	const hasMoreTelemetry = useTelemetryStore((state) => state.hasMore);

	const [selectedLog, setSelectedLog] = useState<TelemetryRow | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const telemetryTypes = useMemo<NonNullable<Parameters<typeof window.electronAPI.getSecurityLogsAround>[1]>>(
		() => ["PROCESS_CREATE", "PROCESS_TERMINATE", "FILE_WRITE", "FILE_RENAME"],
		[],
	);

	const getTelemetryKey = useCallback((item: TelemetryMessage) => {
		return item.sequenceNumber != null
			? `${item.type}-${item.timestamp}-${item.sequenceNumber}`
			: `${item.type}-${item.timestamp}-${JSON.stringify(item.data)}`;
	}, []);

	const {
		visibleItems: visibleEvents,
		hasMoreTop,
		hasMoreBottom,
		isLoadingTop,
		isLoadingBottom,
		loadMore,
		highlightedRowId,
		setHighlightedRowId,
		topOffset,
	} = useBidirectionalInfiniteScroll<TelemetryMessage>({
		cachedItems: events,
		pageSize: 15,
		initialHasMoreBottom: hasMoreTelemetry,
		targetTimestamp,
		targetItemKey,
		getItemTimestamp: (item) => item.timestamp,
		getItemKey: getTelemetryKey,
		getRowId: getTelemetryKey,
		fetchFromElectron: useCallback(
			async ({ timestamp, direction, limit }) => {
				const logs = await window.electronAPI.getSecurityLogs({
					types: telemetryTypes,
					...(direction === "older" ? { beforeTimestamp: timestamp } : { afterTimestamp: timestamp, direction: "newer" }),
					limit,
				});
				return {
					items: logs as TelemetryMessage[],
					hasMore: logs.length >= limit,
				};
			},
			[telemetryTypes],
		),
		fetchAroundFromElectron: useCallback(
			async ({ targetTimestamp, limit }) => {
				const res = await window.electronAPI.getSecurityLogsAround(targetTimestamp, telemetryTypes, limit);
				return {
					items: res.logs as TelemetryMessage[],
					hasMoreTop: res.hasMoreTop,
					hasMoreBottom: res.hasMoreBottom,
					topOffset: res.topOffset,
				};
			},
			[telemetryTypes],
		),
		onItemsFetched: useCallback((items: TelemetryMessage[]) => {
			useTelemetryStore.getState().addEvents(items as IncomingIPCMessage[]);
		}, []),
	});

	const tableData: TelemetryRow[] = visibleEvents.map((item) => {
		const data = item.data as unknown as Record<string, unknown>;
		const timestamp = item.timestamp;
		const createdAt = timestamp ? new Date(timestamp).toLocaleString() : "-";

		const processId = (data.processId as number | undefined) ?? "-";
		const rawPath = (data.imagePath as string | undefined) || (data.filePath as string | undefined) || "";
		const processName = rawPath ? rawPath.split(/[/\\]/).pop() || rawPath : "-";

		const itemKey = item.sequenceNumber != null
			? `${item.type}-${item.timestamp}-${item.sequenceNumber}`
			: `${item.type}-${item.timestamp}-${JSON.stringify(item.data)}`;

		return {
			id: itemKey,
			createdAt,
			action: item.type,
			processId,
			processName,
			imagePath: rawPath || "-",
			source: t(($) => $.telemetry.sourceKernelDriver),
			matchedRule: data.matchedRuleId
				? t(($) => $.telemetry.matchedRuleId, { id: data.matchedRuleId })
				: undefined,
			details: JSON.stringify(item, null, 2),
			rawItem: item,
		};
	});

	const handleRowClick = (log: TelemetryRow) => {
		setSelectedLog(log);
		setIsSheetOpen(true);
	};

	return (
		<div className="flex flex-col gap-6 min-w-0">
			{/* 페이지 타이틀 헤더 */}
			<div>
				<h2 className="text-2xl font-bold tracking-tight">
					{t(($) => $.telemetry.heading)}
				</h2>
				<p className="text-sm text-muted-foreground">
					{t(($) => $.telemetry.description)}
				</p>
			</div>

			{/* 메인 고밀도 데이터그리드 DataTable */}
			<DataTable
				heading={t(($) => $.telemetry.tableHeading)}
				columns={columns}
				data={tableData}
				enableSearch={true}
				enableRowNumber={true}
				rowNumberOffset={topOffset}
				filterPlaceholder={t(($) => $.telemetry.searchPlaceholder)}
				filterColumnKey="processName"
				defaultPageSize={20}
				hasMoreTop={hasMoreTop}
				hasMoreBottom={hasMoreBottom}
				isLoadingMoreTop={isLoadingTop}
				isLoadingMoreBottom={isLoadingBottom}
				onLoadMoreTop={() => loadMore("newer")}
				onLoadMoreBottom={() => loadMore("older")}
				highlightedRowId={highlightedRowId}
				onHighlightEnd={() => setHighlightedRowId(null)}
				maxHeight="calc(100vh - 18rem)"
				onRowClick={(row) => handleRowClick(row)}
			/>

			{/* 행 클릭 시 우측에서 슬라이드 오픈되는 검사 패널 Sheet */}
			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent side="right" className="sm:max-w-lg w-full p-0 overflow-hidden flex flex-col">
					<SheetHeader className="p-6 pb-4 border-b shrink-0">
						<SheetTitle className="flex items-center gap-2 text-base font-bold">
							<Activity className="size-5 text-primary shrink-0"/>
							<span className="truncate">{t(($) => $.telemetry.sheet.title)}</span>
						</SheetTitle>
						<SheetDescription className="text-xs break-all">
							{t(($) => $.telemetry.sheet.description, {
								id: selectedLog ? eventDisplayId(selectedLog.details) : "-",
								source: selectedLog?.source ?? "-",
							})}
						</SheetDescription>
					</SheetHeader>

					{selectedLog && (
						<ScrollArea className="flex-1 min-h-0">
							<div className="space-y-4 px-6 py-4 text-xs">
								{/* 기본 정보 테이블 카드 */}
								<div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg border">
									<div className="min-w-0">
										<span className="text-muted-foreground flex items-center gap-1 mb-1">
											<Clock className="size-3 shrink-0"/> {t(($) => $.telemetry.sheet.createdAt)}
										</span>
										<span className="font-mono font-medium block truncate" title={selectedLog.createdAt}>
											{selectedLog.createdAt}
										</span>
									</div>

									<div className="min-w-0">
										<span className="text-muted-foreground flex items-center gap-1 mb-1">
											<Shield className="size-3 shrink-0"/> {t(($) => $.telemetry.sheet.actionResult)}
										</span>
										<Badge
											variant={
												selectedLog.action === "BLOCKED" || selectedLog.action === "TERMINATED"
													? "destructive"
													: "default"
											}
											className="text-[10px] truncate max-w-full block"
											title={selectedLog.action}
										>
											{selectedLog.action}
										</Badge>
									</div>

									<div className="min-w-0">
										<span className="text-muted-foreground flex items-center gap-1 mb-1">
											<Terminal className="size-3 shrink-0"/> {t(($) => $.telemetry.sheet.processId)}
										</span>
										<span className="font-mono font-bold block truncate">{selectedLog.processId}</span>
									</div>

									<div className="min-w-0">
										<span className="text-muted-foreground flex items-center gap-1 mb-1">
											<Terminal className="size-3 shrink-0"/> {t(($) => $.telemetry.sheet.processName)}
										</span>
										<span className="font-medium block break-all" title={selectedLog.processName}>
											{selectedLog.processName}
										</span>
									</div>
								</div>

								{/* 대상 이미지 경로 */}
								{selectedLog.imagePath && selectedLog.imagePath !== "-" && (
									<div className="space-y-1.5">
										<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
											<HardDrive className="size-3.5 shrink-0"/> {t(($) => $.telemetry.sheet.imagePath)}
										</label>
										<ScrollArea className="max-h-36 overflow-hidden [&_[data-slot=scroll-area-viewport]]:max-h-36 rounded-md border bg-background">
											<div className="p-2.5 font-mono text-[11px] break-all leading-normal">
												{selectedLog.imagePath}
											</div>
										</ScrollArea>
									</div>
								)}

								{/* 매칭된 룰 및 엔트로피 */}
								{selectedLog.matchedRule && (
									<div className="space-y-1.5">
										<label className="text-xs font-semibold text-muted-foreground">
											{t(($) => $.telemetry.sheet.matchedRule)}
										</label>
										<ScrollArea className="max-h-36 overflow-hidden [&_[data-slot=scroll-area-viewport]]:max-h-36 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
											<div className="p-2.5 font-mono text-xs font-medium break-all whitespace-pre-wrap leading-relaxed">
												{selectedLog.matchedRule}
											</div>
										</ScrollArea>
									</div>
								)}

								<EventExplanation raw={selectedLog.details}/>
								{/* RAW JSON Details */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
										<FileText className="size-3.5 shrink-0"/> {t(($) => $.telemetry.sheet.rawJson)}
									</label>
									<ScrollArea className="max-h-80 overflow-hidden [&_[data-slot=scroll-area-viewport]]:max-h-80 rounded-md border bg-muted/80">
										<pre className="p-3 font-mono text-[11px] whitespace-pre-wrap break-all leading-relaxed text-foreground/90">
											{selectedLog.details}
										</pre>
									</ScrollArea>
								</div>
							</div>
						</ScrollArea>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
