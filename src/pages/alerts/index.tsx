import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import {
	ShieldAlert,
	RefreshCw,
	Filter,
	Clock,
	FileText,
	HardDrive,
	Terminal,
	Shield,
} from "lucide-react";

import type { FlattenedKeys } from "@/locales";
import { useAlertStore, useMetricStore } from "@/store";

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { DataTable, type DataTableFeatures } from "@/components/data-table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { I18n } from "@/components/i18n";



export interface AlertFilterItem {
	label: FlattenedKeys<"alerts.filters">;
	value: "ALL" | "THREATS" | "RECOVERY";
}

const alertFilterItems: [AlertFilterItem, ...AlertFilterItem[]] = [
	{
		label: "all",
		value: "ALL",
	},
	{
		label: "threats",
		value: "THREATS",
	},
	{
		label: "recovery",
		value: "RECOVERY",
	},
];

export interface FormattedAlert {
	id: string;
	processId?: number;
	processName?: string;
	imagePath?: string;
	action: string;
	matchedRule?: string;
	threatScore: number;
	source: string;
	details: string;
	createdAt: string;
	isThreat: boolean;
	isRecovery: boolean;
}



const columnHelper = createColumnHelper<DataTableFeatures, FormattedAlert>();

const columns: ColumnDef<DataTableFeatures, FormattedAlert>[] = columnHelper.columns([
	{
		accessorKey: "createdAt",
		header: () => <I18n i18nKey="alerts.columns.createdAt"/>,
		cell: ({ row }) => (
			<span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
				{row.original.createdAt}
			</span>
		),
	},
	{
		accessorKey: "action",
		header: () => <I18n i18nKey="alerts.columns.action"/>,
		cell: ({ row }) => {
			const { action, isThreat, isRecovery } = row.original;
			return (
				<Badge
					variant={isThreat ? "destructive" : "default"}
					className={isRecovery ? "bg-emerald-600 hover:bg-emerald-700 text-[11px] px-2 py-0.5" : "text-[11px] px-2 py-0.5"}
				>
					{action}
				</Badge>
			);
		},
	},
	{
		accessorKey: "matchedRule",
		header: () => <I18n i18nKey="alerts.columns.matchedRule"/>,
		filterFn: (row, _columnId, filterValue) => {
			const query = String(filterValue ?? "").toLowerCase().trim();
			if (!query) return true;
			return (
				(row.original.processName?.toLowerCase().includes(query) ?? false) ||
				(row.original.matchedRule?.toLowerCase().includes(query) ?? false) ||
				(row.original.imagePath?.toLowerCase().includes(query) ?? false) ||
				row.original.action.toLowerCase().includes(query) ||
				row.original.source.toLowerCase().includes(query) ||
				String(row.original.processId ?? "").includes(query)
			);
		},
		cell: ({ row }) => (
			<span className="font-medium text-foreground truncate max-w-xs block">
				{row.original.matchedRule ?? row.original.action}
			</span>
		),
	},
	{
		accessorKey: "processName",
		header: () => <I18n i18nKey="alerts.columns.processName"/>,
		cell: ({ row }) => {
			const { processName, processId } = row.original;
			if (!processName && processId === undefined) {
				return <span className="text-xs text-muted-foreground">-</span>;
			}
			return (
				<span className="font-mono text-xs font-medium whitespace-nowrap">
					{processName ?? "-"}
					{processId !== undefined && (
						<span className="text-muted-foreground ml-1">({processId})</span>
					)}
				</span>
			);
		},
	},
	{
		accessorKey: "imagePath",
		header: () => <I18n i18nKey="alerts.columns.imagePath"/>,
		cell: ({ row }) => (
			<span className="font-mono text-xs text-muted-foreground truncate max-w-xs block">
				{row.original.imagePath ?? "-"}
			</span>
		),
	},
	{
		accessorKey: "threatScore",
		header: () => <I18n i18nKey="alerts.columns.threatScore"/>,
		cell: ({ row }) => {
			const { isThreat, threatScore } = row.original;
			if (!isThreat) {
				return <span className="font-mono text-xs text-muted-foreground">-</span>;
			}
			return (
				<span className="font-mono text-xs font-bold text-destructive whitespace-nowrap">
					{threatScore} / 100
				</span>
			);
		},
	},
	{
		accessorKey: "source",
		header: () => <I18n i18nKey="alerts.columns.source"/>,
		cell: ({ row }) => (
			<span className="text-xs text-muted-foreground whitespace-nowrap">
				{row.original.source}
			</span>
		),
	},
]);

export default function AlertsPage() {
	const { t } = useTranslation();
	const rawAlerts = useAlertStore((state) => state.alerts);
	const hasMore = useAlertStore((state) => state.hasMore);
	const isLoadingMore = useAlertStore((state) => state.isLoadingMore);
	const fetchMoreAlerts = useAlertStore((state) => state.fetchMoreAlerts);
	const totalCounts = useMetricStore((state) => state.totalCounts);

	const [filterItem, setFilterItem] = useState<AlertFilterItem>(alertFilterItems[0]);
	const [selectedAlert, setSelectedAlert] = useState<FormattedAlert | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const getFilterLabel = (item: AlertFilterItem) => t(($) => $.alerts.filters[item.label]);

	const formattedAlerts: FormattedAlert[] = rawAlerts.map((item, idx) => {
		const timestamp = item.timestamp;
		const createdAt = timestamp ? new Date(timestamp).toLocaleString() : "-";

		let processId: number | undefined;
		let processName: string | undefined;
		let imagePath: string | undefined;
		let action = item.type as string;
		let matchedRule: string | undefined;
		let threatScore = 10;
		let source = t(($) => $.alerts.sources.kernelDriver);

		if (item.type === "ALERT") {
			const alertData = item.data;
			processId = alertData.processId;
			processName = alertData.processName;
			action = alertData.action || "ALERT";
			matchedRule = alertData.ruleName;
			threatScore = alertData.threatScore ?? 80;
			imagePath = alertData.filePath ?? undefined;
			source = t(($) => $.alerts.sources.correlationEngine);
		} else if (item.type === "PROCESS_BLOCKED") {
			const procData = item.data;
			processId = procData.processId;
			imagePath = procData.imagePath ?? undefined;
			if (imagePath) {
				processName = imagePath.split(/[/\\]/).pop();
			}
			matchedRule = procData.matchedRuleId
				? t(($) => $.alerts.defaults.ruleId, { id: procData.matchedRuleId })
				: t(($) => $.alerts.defaults.ruleBlocked);
			action = "BLOCKED";
			threatScore = 90;
			source = t(($) => $.alerts.sources.kernelDriver);
		} else if (item.type === "VSS_ATTEMPT") {
			const vssData = item.data;
			processId = vssData.processId;
			action = vssData.action || "VSS_ATTEMPT";
			matchedRule = t(($) => $.alerts.defaults.vssTamperAttempt);
			threatScore = 95;
			source = t(($) => $.alerts.sources.vssFilter);
		} else if (item.type === "VSS_STATUS") {
			const vssStatus = item.data;
			action = vssStatus.action || "VSS_STATUS";
			imagePath = vssStatus.targetPath;
			matchedRule = vssStatus.message || t(($) => $.alerts.defaults.vssBackupRestore);
			threatScore = 0;
			source = t(($) => $.alerts.sources.vssRestoreEngine);
		}

		const isThreat =
			action === "BLOCKED" ||
			action === "TERMINATED" ||
			action === "QUARANTINED" ||
			item.type === "VSS_ATTEMPT" ||
			item.type === "PROCESS_BLOCKED";
		const isRecovery =
			action === "RESTORE_COMPLETED" ||
			action === "BACKUP_CREATED" ||
			item.type === "VSS_STATUS";

		return {
			id: `alert-${timestamp}-${idx}`,
			processId,
			processName,
			imagePath,
			action,
			matchedRule,
			threatScore,
			source,
			details: JSON.stringify(item, null, 2),
			createdAt,
			isThreat,
			isRecovery,
		};
	});

	const filteredLogs = formattedAlerts.filter((log) => {
		if (filterItem.value === "THREATS") {
			return log.isThreat;
		}
		if (filterItem.value === "RECOVERY") {
			return log.isRecovery;
		}
		return true;
	});

	const threatCount = Math.max(totalCounts.threat, formattedAlerts.filter((l) => l.isThreat).length);
	const recoveryCount = Math.max(totalCounts.recovery, formattedAlerts.filter((l) => l.isRecovery).length);

	const handleRowClick = (alert: FormattedAlert) => {
		setSelectedAlert(alert);
		setIsSheetOpen(true);
	};

	return (
		<div className="flex flex-col gap-6 min-w-0">
			{/* 페이지 상단 서머리 헤더 */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">
						{t(($) => $.alerts.heading)}
					</h2>
					<p className="text-sm text-muted-foreground">
						{t(($) => $.alerts.description)}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="destructive" className="px-3 py-1 text-xs gap-1.5">
						<ShieldAlert className="size-3.5"/>
						<span>{t(($) => $.alerts.threatCount, { count: threatCount })}</span>
					</Badge>
					<Badge variant="default" className="px-3 py-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700">
						<RefreshCw className="size-3.5"/>
						<span>{t(($) => $.alerts.recoveryCount, { count: recoveryCount })}</span>
					</Badge>
				</div>
			</div>

			{/* 위협 및 복구 이벤트 DataTable */}
			<DataTable
				heading={t(($) => $.alerts.tableHeading)}
				columns={columns}
				data={filteredLogs}
				enableSearch={true}
				enableRowNumber={true}
				filterPlaceholder={t(($) => $.alerts.searchPlaceholder)}
				filterColumnKey="matchedRule"
				hasMore={hasMore}
				isLoadingMore={isLoadingMore}
				onLoadMore={fetchMoreAlerts}
				maxHeight="calc(100vh - 18rem)"
				onRowClick={(row) => handleRowClick(row)}
			>
				<div className="flex items-center gap-2">
					<Filter className="size-4 text-muted-foreground shrink-0"/>
					<Select
						value={filterItem}
						onValueChange={(val) => setFilterItem(val ?? alertFilterItems[0])}
						itemToStringLabel={getFilterLabel}
					>
						<SelectTrigger className="w-44">
							<SelectValue placeholder={getFilterLabel(filterItem)}/>
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectGroup>
								{alertFilterItems.map((item) => (
									<SelectItem
										key={item.value}
										value={item}
										className="rounded-lg"
									>
										{getFilterLabel(item)}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</DataTable>

			{/* 행 클릭 시 우측에서 슬라이드 오픈되는 검사 패널 Sheet */}
			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent side="right" className="sm:max-w-md w-full p-6 overflow-y-auto">
					<SheetHeader className="p-0 pb-4 border-b">
						<SheetTitle className="flex items-center gap-2 text-base font-bold">
							{selectedAlert?.isRecovery ? (
								<RefreshCw className="size-5 text-emerald-600"/>
							) : (
								<ShieldAlert className="size-5 text-destructive"/>
							)}
							<span>{t(($) => $.alerts.sheet.title)}</span>
						</SheetTitle>
						<SheetDescription className="text-xs">
							{t(($) => $.alerts.sheet.description, {
								id: selectedAlert?.id ?? "-",
								source: selectedAlert?.source ?? "-",
							})}
						</SheetDescription>
					</SheetHeader>

					{selectedAlert && (
						<div className="space-y-4 py-4 text-xs">
							{/* 기본 정보 카드 */}
							<div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg border">
								<div>
									<span className="text-muted-foreground flex items-center gap-1 mb-1">
										<Clock className="size-3"/> {t(($) => $.alerts.sheet.createdAt)}
									</span>
									<span className="font-mono font-medium">{selectedAlert.createdAt}</span>
								</div>

								<div>
									<span className="text-muted-foreground flex items-center gap-1 mb-1">
										<Shield className="size-3"/> {t(($) => $.alerts.sheet.actionResult)}
									</span>
									<Badge
										variant={selectedAlert.isThreat ? "destructive" : "default"}
										className={selectedAlert.isRecovery ? "bg-emerald-600 hover:bg-emerald-700 text-[10px]" : "text-[10px]"}
									>
										{selectedAlert.action}
									</Badge>
								</div>

								<div>
									<span className="text-muted-foreground flex items-center gap-1 mb-1">
										<Terminal className="size-3"/> {t(($) => $.alerts.sheet.processId)}
									</span>
									<span className="font-mono font-bold">{selectedAlert.processId ?? "-"}</span>
								</div>

								<div>
									<span className="text-muted-foreground flex items-center gap-1 mb-1">
										<Terminal className="size-3"/> {t(($) => $.alerts.sheet.processName)}
									</span>
									<span className="font-medium">{selectedAlert.processName ?? "-"}</span>
								</div>
							</div>

							{/* 위협 스코어 프로그레스 바 */}
							{selectedAlert.isThreat && (
								<div className="space-y-1.5">
									<div className="flex justify-between text-xs font-medium">
										<span className="text-muted-foreground">
											{t(($) => $.alerts.sheet.threatScore)}
										</span>
										<span className="text-destructive font-mono font-bold">
											{selectedAlert.threatScore} / 100
										</span>
									</div>
									<Progress value={selectedAlert.threatScore} className="h-1.5"/>
								</div>
							)}

							{/* 매칭된 룰 / 복구 메시지 */}
							{selectedAlert.matchedRule && (
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground">
										{t(($) => $.alerts.sheet.matchedRule)}
									</label>
									<div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-md font-mono text-xs font-medium">
										{selectedAlert.matchedRule}
									</div>
								</div>
							)}

							{/* 대상 경로 */}
							{selectedAlert.imagePath && (
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
										<HardDrive className="size-3.5"/> {t(($) => $.alerts.sheet.imagePath)}
									</label>
									<div className="p-2.5 bg-background border rounded-md font-mono text-[11px] break-all leading-normal">
										{selectedAlert.imagePath}
									</div>
								</div>
							)}

							{/* RAW JSON Details */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
									<FileText className="size-3.5"/> {t(($) => $.alerts.sheet.rawJson)}
								</label>
								<pre className="p-3 bg-muted/80 rounded-md font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed text-foreground/90 max-h-80 border">
									{selectedAlert.details}
								</pre>
							</div>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
