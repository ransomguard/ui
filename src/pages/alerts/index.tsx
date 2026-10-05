import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ShieldAlert,
	ShieldCheck,
	RefreshCw,
	Filter,
	Clock,
	FileText,
	HardDrive,
	Search,
} from "lucide-react";

import type { FlattenedKeys } from "@/locales";
import { useAlertStore } from "@/store";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";



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

export default function AlertsPage() {
	const { t } = useTranslation();
	const rawAlerts = useAlertStore((state) => state.alerts);
	const [filterItem, setFilterItem] = useState<AlertFilterItem>(alertFilterItems[0]);
	const [searchQuery, setSearchQuery] = useState("");

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
		const matchesSearch =
			!searchQuery ||
			(log.processName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
			(log.matchedRule?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
			(log.imagePath?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

		if (!matchesSearch) return false;

		if (filterItem.value === "THREATS") {
			return log.isThreat;
		}
		if (filterItem.value === "RECOVERY") {
			return log.isRecovery;
		}
		return true;
	});

	const threatCount = formattedAlerts.filter((l) => l.isThreat).length;
	const recoveryCount = formattedAlerts.filter((l) => l.isRecovery).length;

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

			{/* 검색 및 필터 툴바 */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
				<div className="relative w-full sm:w-80">
					<Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"/>
					<Input
						placeholder={t(($) => $.alerts.searchPlaceholder)}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>

				<div className="flex items-center gap-2 w-full sm:w-auto">
					<Filter className="size-4 text-muted-foreground shrink-0"/>
					<Select
						value={filterItem}
						onValueChange={(val) => setFilterItem(val ?? alertFilterItems[0])}
						itemToStringLabel={getFilterLabel}
					>
						<SelectTrigger className="w-full sm:w-44">
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
			</div>

			{/* 이벤트 Feed (ScrollArea) */}
			{filteredLogs.length === 0 ? (
				<Card className="p-8 text-center border-dashed">
					<ShieldCheck className="size-12 text-emerald-500 mx-auto mb-3"/>
					<h3 className="text-base font-semibold">
						{t(($) => $.alerts.empty.title)}
					</h3>
					<p className="text-sm text-muted-foreground mt-1">
						{t(($) => $.alerts.empty.description)}
					</p>
				</Card>
			) : (
				<ScrollArea className="h-[calc(100vh-16rem)] pr-2">
					<div className="flex flex-col gap-4">
						{filteredLogs.map((log) => (
							<Card
								key={log.id}
								className={`transition-all ${
									log.isThreat
										? "border-destructive/40 bg-destructive/5 dark:bg-destructive/10"
										: log.isRecovery
											? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10"
											: ""
								}`}
							>
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between gap-3">
										<div className="flex items-center gap-3">
											<div
												className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${
													log.isThreat
														? "border-destructive/40 text-destructive bg-background/80"
														: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-background/80"
												}`}
											>
												{log.isThreat ? (
													<ShieldAlert className="size-5"/>
												) : (
													<RefreshCw className="size-5"/>
												)}
											</div>

											<div>
												<CardTitle className="text-base font-semibold flex items-center gap-2">
													<span>{log.matchedRule ?? log.action}</span>
													{log.processName && (
														<span className="text-xs font-mono font-normal text-muted-foreground">
															({log.processName} - PID: {log.processId ?? "-"})
														</span>
													)}
												</CardTitle>
												<CardDescription className="flex items-center gap-2 text-xs mt-0.5">
													<Clock className="size-3.5"/>
													<span>{log.createdAt}</span>
													<span>•</span>
													<span>{t(($) => $.alerts.card.source, { source: log.source })}</span>
												</CardDescription>
											</div>
										</div>

										<Badge
											variant={log.isThreat ? "destructive" : "default"}
											className={log.isRecovery ? "bg-emerald-600 hover:bg-emerald-700" : ""}
										>
											{log.action}
										</Badge>
									</div>
								</CardHeader>

								<CardContent className="space-y-3 pt-0">
									{/* 위협 스코어 프로그레스 바 */}
									{log.isThreat && (
										<div className="space-y-1">
											<div className="flex justify-between text-xs font-medium">
												<span className="text-muted-foreground">
													{t(($) => $.alerts.card.threatScore)}
												</span>
												<span className="text-destructive font-mono font-bold">
													{log.threatScore} / 100
												</span>
											</div>
											<Progress value={log.threatScore} className="h-1.5"/>
										</div>
									)}

									{/* 이미지 경로 및 상세 Accordion */}
									{log.imagePath && (
										<div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-background/60 p-2 rounded-md border">
											<HardDrive className="size-3.5 shrink-0 text-foreground/70"/>
											<span className="truncate">{log.imagePath}</span>
										</div>
									)}

									<Accordion className="w-full">
										<AccordionItem value={`item-${log.id}`} className="border-none">
											<AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
												<span className="flex items-center gap-1.5">
													<FileText className="size-3.5"/>
													{t(($) => $.alerts.card.rawJson)}
												</span>
											</AccordionTrigger>
											<AccordionContent className="pt-2">
												<pre className="p-3 bg-muted/70 rounded-md text-[11px] font-mono overflow-x-auto whitespace-pre-wrap text-foreground/90">
													{log.details}
												</pre>
											</AccordionContent>
										</AccordionItem>
									</Accordion>
								</CardContent>
							</Card>
						))}
					</div>
				</ScrollArea>
			)}
		</div>
	);
}
