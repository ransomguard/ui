import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import {
	Plus,
	Trash2,
	MoreHorizontal,
	ShieldBan,
	ShieldCheck,
	ShieldAlert,
	History,
	RefreshCw,
	CheckCircle2,
	XCircle,
	Globe,
	Link2,
	Network,
	Clock,
	FileText,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableFeatures } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { I18n } from "@/components/i18n";
import { useAccessControlStore, useAlertStore, useMetricStore } from "@/store";
import { useBidirectionalInfiniteScroll } from "@/hooks/use-bidirectional-infinite-scroll";
import { useSearchParamTab } from "@/hooks/use-search-param-tab";
import type {
	WhitelistItem,
	WhitelistItemData,
	WhitelistItemType,
} from "~/services/firewall-tool";



// Data types for rendering
export interface WhitelistedTargetRecord {
	id: string;
	type: WhitelistItemType;
	value: string;
	port: number;
	cidr?: number;
	domain?: string;
	ipv4?: string;
	ipv6?: string;
	ipv4List?: string[];
	ipv6List?: string[];
	resolvedIps: string[];
	description: string;
	addedAt: string;
	data: WhitelistItemData;
	rawItem: WhitelistItem;
}

export interface BlockedProcessRecord {
	id: string;
	processId: number | string;
	processName: string;
	imagePath: string;
	reason: string;
	source: string;
	blockedAt: string;
	timestamp: number;
}

export interface AccessControlLogRecord {
	id: string;
	target: "block" | "whitelist";
	action: "add" | "remove";
	ipAddress: string;
	reason: string;
	success: boolean;
	errorMessage?: string | null;
	performedAt: string;
	timestamp: number;
}



const blockedProcessesColumnHelper = createColumnHelper<DataTableFeatures, BlockedProcessRecord>();
const blockedProcessesColumns: ColumnDef<DataTableFeatures, BlockedProcessRecord>[] = blockedProcessesColumnHelper.columns([
	{
		accessorKey: "processId",
		header: () => <I18n i18nKey="accessControl.blockedProcessesTable.columns.processId"/>,
		cell: ({ row }) => (
			<span className="font-mono text-xs font-medium">
				{row.original.processId}
			</span>
		),
	},
	{
		accessorKey: "processName",
		header: () => <I18n i18nKey="accessControl.blockedProcessesTable.columns.processName"/>,
		filterFn: (row, _columnId, filterValue) => {
			const q = String(filterValue ?? "").toLowerCase().trim();
			if (!q) return true;
			return (
				String(row.original.processId).toLowerCase().includes(q) ||
				row.original.processName.toLowerCase().includes(q) ||
				row.original.imagePath.toLowerCase().includes(q) ||
				row.original.reason.toLowerCase().includes(q) ||
				row.original.source.toLowerCase().includes(q)
			);
		},
		cell: ({ row }) => (
			<span className="font-mono font-bold text-destructive">
				{row.original.processName}
			</span>
		),
	},
	{
		accessorKey: "imagePath",
		header: () => <I18n i18nKey="accessControl.blockedProcessesTable.columns.imagePath"/>,
		cell: ({ row }) => (
			<span className="font-mono text-xs text-muted-foreground truncate max-w-md block" title={row.original.imagePath}>
				{row.original.imagePath}
			</span>
		),
	},
	{
		accessorKey: "reason",
		header: () => <I18n i18nKey="accessControl.blockedProcessesTable.columns.reason"/>,
		cell: ({ row }) => (
			<span className="text-foreground/90">{row.original.reason}</span>
		),
	},
	{
		accessorKey: "source",
		header: () => <I18n i18nKey="accessControl.blockedProcessesTable.columns.source"/>,
		cell: ({ row }) => (
			<Badge variant="outline" className="text-[11px]">
				{row.original.source}
			</Badge>
		),
	},
	{
		accessorKey: "blockedAt",
		header: () => <I18n i18nKey="accessControl.blockedProcessesTable.columns.blockedAt"/>,
		cell: ({ row }) => (
			<span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
				{row.original.blockedAt}
			</span>
		),
	},
]);



const logsColumnHelper = createColumnHelper<DataTableFeatures, AccessControlLogRecord>();
const logsColumns: ColumnDef<DataTableFeatures, AccessControlLogRecord>[] = logsColumnHelper.columns([
	{
		accessorKey: "performedAt",
		header: () => <I18n i18nKey="accessControl.logsTable.columns.performedAt"/>,
		cell: ({ row }) => (
			<span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
				{row.original.performedAt}
			</span>
		),
	},
	{
		accessorKey: "target",
		header: () => <I18n i18nKey="accessControl.logsTable.columns.target"/>,
		cell: ({ row }) => {
			const isBlock = row.original.target === "block";
			return (
				<Badge
					variant={isBlock ? "destructive" : "default"}
					className={!isBlock ? "bg-emerald-600 hover:bg-emerald-700" : undefined}
				>
					<I18n
						i18nKey={
							isBlock
								? "accessControl.logsTable.targets.block"
								: "accessControl.logsTable.targets.whitelist"
						}
					/>
				</Badge>
			);
		},
	},
	{
		accessorKey: "action",
		header: () => <I18n i18nKey="accessControl.logsTable.columns.action"/>,
		cell: ({ row }) => {
			const isAdd = row.original.action === "add";
			return (
				<Badge variant={isAdd ? "secondary" : "outline"} className="font-mono text-[11px]">
					<I18n
						i18nKey={
							isAdd
								? "accessControl.logsTable.actions.add"
								: "accessControl.logsTable.actions.remove"
						}
					/>
				</Badge>
			);
		},
	},
	{
		accessorKey: "ipAddress",
		header: () => <I18n i18nKey="accessControl.logsTable.columns.ipAddress"/>,
		filterFn: (row, _columnId, filterValue) => {
			const q = String(filterValue ?? "").toLowerCase().trim();
			if (!q) return true;
			return (
				row.original.ipAddress.toLowerCase().includes(q) ||
				row.original.reason.toLowerCase().includes(q) ||
				row.original.target.toLowerCase().includes(q) ||
				row.original.action.toLowerCase().includes(q)
			);
		},
		cell: ({ row }) => (
			<span className="font-mono font-medium">{row.original.ipAddress}</span>
		),
	},
	{
		accessorKey: "reason",
		header: () => <I18n i18nKey="accessControl.logsTable.columns.reason"/>,
		cell: ({ row }) => (
			<span className="text-foreground/90">{row.original.reason}</span>
		),
	},
	{
		accessorKey: "success",
		header: () => <I18n i18nKey="accessControl.logsTable.columns.status"/>,
		cell: ({ row }) => {
			const { success, errorMessage } = row.original;
			return (
				<div className="flex items-center gap-1.5">
					<Badge variant={success ? "outline" : "destructive"} className="gap-1">
						{success ? (
							<CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400"/>
						) : (
							<XCircle className="size-3"/>
						)}
						<I18n
							i18nKey={
								success
									? "accessControl.logsTable.statuses.success"
									: "accessControl.logsTable.statuses.failed"
							}
						/>
					</Badge>
					{!success && errorMessage && (
						<span className="text-xs text-destructive truncate max-w-48" title={errorMessage}>
							({errorMessage})
						</span>
					)}
				</div>
			);
		},
	},
]);



export default function AccessControlPage() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const highlightId = searchParams.get("highlightId");
	const targetParam = searchParams.get("target");
	const timestampParam = searchParams.get("timestamp");
	const targetTimestamp = timestampParam ? Number(timestampParam) : undefined;
	const targetItemKey = searchParams.get("itemKey") ?? undefined;

	const isFirewallActive = useAccessControlStore((state) => state.isFirewallActive);
	const whitelistItems = useAccessControlStore((state) => state.whitelistItems);
	const storeLogs = useAccessControlStore((state) => state.logs);
	const storeHasMoreLogs = useAccessControlStore((state) => state.hasMoreLogs);
	const storeIsLoading = useAccessControlStore((state) => state.isLoading);
	const isRefreshing = useAccessControlStore((state) => state.isRefreshing);

	const fetchRules = useAccessControlStore((state) => state.fetchRules);
	const addWhitelist = useAccessControlStore((state) => state.addWhitelist);
	const removeWhitelist = useAccessControlStore((state) => state.removeWhitelist);
	const refreshWhitelist = useAccessControlStore((state) => state.refreshWhitelist);

	const rawAlerts = useAlertStore((state) => state.alerts);
	const hasMoreAlerts = useAlertStore((state) => state.hasMore);
	const isLoadingMoreAlerts = useAlertStore((state) => state.isLoadingMore);
	const fetchMoreAlerts = useAlertStore((state) => state.fetchMoreAlerts);

	const totalCounts = useMetricStore((state) => state.totalCounts);

	const [activeTab, setActiveTab] = useSearchParamTab<
		"whitelisted-targets" | "blocked-processes" | "access-logs"
	>({
		paramName: "tab",
		defaultTab: "whitelisted-targets",
		validTabs: [
			"whitelisted-targets",
			"blocked-processes",
			"access-logs",
		] as const,
	});

	const ruleHighlightTarget = activeTab === "whitelisted-targets"
		? (targetParam || highlightId || null)
		: null;

	const [ruleHighlightedRowId, setRuleHighlightedRowId] = useState<string | null>(ruleHighlightTarget);
	const [prevRuleTarget, setPrevRuleTarget] = useState(ruleHighlightTarget);

	if (prevRuleTarget !== ruleHighlightTarget) {
		setPrevRuleTarget(ruleHighlightTarget);
		setRuleHighlightedRowId(ruleHighlightTarget);
	}

	useEffect(() => {
		fetchRules();
	}, [fetchRules]);

	// 접근 제어 로그 양방향 무한스크롤 및 캐시-우선 조회 훅
	const {
		visibleItems: visibleLogs,
		hasMoreTop: logsHasMoreTop,
		hasMoreBottom: logsHasMoreBottom,
		isLoadingTop: logsIsLoadingTop,
		isLoadingBottom: logsIsLoadingBottom,
		loadMore: loadMoreLogs,
		highlightedRowId: logHighlightedRowId,
		setHighlightedRowId: setLogHighlightedRowId,
		topOffset: logsTopOffset,
	} = useBidirectionalInfiniteScroll<AccessControlLogItem>({
		cachedItems: storeLogs,
		pageSize: 15,
		initialHasMoreBottom: storeHasMoreLogs,
		targetTimestamp,
		targetItemKey,
		getItemTimestamp: (item) => item.performedAt,
		getItemKey: (item) => String(item.id),
		getRowId: useCallback(
			(item: AccessControlLogItem) => {
				if (targetItemKey && targetItemKey.startsWith(`ac-log-${item.id}`)) {
					return targetItemKey;
				}
				return `ac-log-${item.id}-${item.ip ?? 0}`;
			},
			[targetItemKey],
		),
		fetchFromElectron: useCallback(
			async ({ timestamp, direction, limit }) => {
				const logs = await window.electronAPI.getAccessControlLogs({
					...(direction === "older" ? { beforeTimestamp: timestamp } : { afterTimestamp: timestamp, direction: "newer" }),
					limit,
				});
				return {
					items: logs,
					hasMore: logs.length >= limit,
				};
			},
			[],
		),
		fetchAroundFromElectron: useCallback(
			async ({ targetTimestamp, limit }) => {
				const res = await window.electronAPI.getAccessControlLogsAround(targetTimestamp, limit);
				return {
					items: res.logs,
					hasMoreTop: res.hasMoreTop,
					hasMoreBottom: res.hasMoreBottom,
					topOffset: res.topOffset,
				};
			},
			[],
		),
		onItemsFetched: useCallback((items: AccessControlLogItem[]) => {
			useAccessControlStore.getState().addLogs(items);
		}, []),
	});

	// Dialog & Sheet State
	const [newTargetsInput, setNewTargetsInput] = useState("");
	const [whitelistDesc, setWhitelistDesc] = useState("");

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<{ id: string; value: string } | null>(null);
	const [selectedWhitelistItem, setSelectedWhitelistItem] = useState<WhitelistedTargetRecord | null>(null);
	const [isWhitelistSheetOpen, setIsWhitelistSheetOpen] = useState(false);

	// Map WhitelistItems to table data
	const whitelistedTargetsData: WhitelistedTargetRecord[] = useMemo(() => {
		return whitelistItems.map((item) => {
			const matchedLog = storeLogs
				.filter((log) => {
					if (log.target !== "whitelist" || log.action !== "add") return false;
					if (log.ip === item.value) return true;
					const maybeIps = (log as { ips?: string[] | null }).ips;
					return Array.isArray(maybeIps) && maybeIps.includes(item.value);
				})
				.sort((a, b) => b.performedAt - a.performedAt)[0];

			let port = 0;
			let cidr: number | undefined;
			let domain: string | undefined;
			let ipv4: string | undefined;
			let ipv6: string | undefined;
			let ipv4List: string[] | undefined;
			let ipv6List: string[] | undefined;
			let resolvedIps: string[] = [];

			if (item.type === "ipv4") {
				const data = item.data as { ipv4: string; port: number; cidr: number };
				ipv4 = data.ipv4;
				port = data.port;
				cidr = data.cidr;
			} else if (item.type === "ipv6") {
				const data = item.data as { ipv6: string; port: number; cidr: number };
				ipv6 = data.ipv6;
				port = data.port;
				cidr = data.cidr;
			} else if (item.type === "domain" || item.type === "url") {
				const data = item.data as { domain: string; port: number; ipv4?: string[]; ipv6?: string[] };
				port = data.port;
				domain = data.domain;
				ipv4List = data.ipv4 ?? [];
				ipv6List = data.ipv6 ?? [];
				resolvedIps = [...ipv4List, ...ipv6List];
			}

			return {
				id: item.value,
				type: item.type,
				value: item.value,
				port,
				cidr,
				domain,
				ipv4,
				ipv6,
				ipv4List,
				ipv6List,
				resolvedIps,
				description: matchedLog?.reason || t(($) => $.accessControl.defaults.externalWhitelistDesc),
				addedAt: matchedLog?.performedAt ? new Date(matchedLog.performedAt).toLocaleString() : "-",
				data: item.data,
				rawItem: item,
			};
		});
	}, [whitelistItems, storeLogs, t]);

	const blockedProcessesData: BlockedProcessRecord[] = useMemo(() => {
		return rawAlerts
			.flatMap((item, idx): BlockedProcessRecord[] => {
				const timestamp = item.timestamp;
				const blockedAt = timestamp ? new Date(timestamp).toLocaleString() : "-";

				if (item.type === "PROCESS_BLOCKED") {
					const procData = item.data;
					const imagePath = procData.imagePath || procData.commandLine || "-";
					const processName = procData.imagePath
						? procData.imagePath.split(/[/\\]/).pop() || procData.imagePath
						: procData.commandLine
							? procData.commandLine.split(/\s+/)[0] || "-"
							: "-";
					const reason = procData.matchedRuleId
						? t(($) => $.alerts.defaults.ruleId, { id: procData.matchedRuleId })
						: t(($) => $.alerts.defaults.ruleBlocked);

					return [
						{
							id: `blocked-proc-${timestamp}-${idx}`,
							processId: procData.processId ?? "-",
							processName,
							imagePath,
							reason,
							source: t(($) => $.alerts.sources.kernelDriver),
							blockedAt,
							timestamp,
						},
					];
				}

				if (
					item.type === "ALERT" &&
					(item.data.action === "BLOCKED" || item.data.action === "QUARANTINED")
				) {
					const alertData = item.data;
					const imagePath = alertData.filePath || "-";
					const processName =
						alertData.processName ||
						(alertData.filePath ? alertData.filePath.split(/[/\\]/).pop() || alertData.filePath : "-");

					return [
						{
							id: `blocked-alert-${timestamp}-${idx}`,
							processId: alertData.processId ?? "-",
							processName,
							imagePath,
							reason: alertData.ruleName || alertData.action,
							source: t(($) => $.alerts.sources.correlationEngine),
							blockedAt,
							timestamp,
						},
					];
				}

				return [];
			})
			.sort((a, b) => b.timestamp - a.timestamp);
	}, [rawAlerts, t]);

	const accessLogsData: AccessControlLogRecord[] = useMemo(() => {
		return visibleLogs
			.flatMap((log) => {
				const timestamp = log.performedAt;
				const performedAt = timestamp ? new Date(timestamp).toLocaleString() : "-";
				const maybeIps = (log as { ips?: string[] | null }).ips;
				const ipsList = log.ip
					? [log.ip]
					: Array.isArray(maybeIps) && maybeIps.length > 0
						? maybeIps
						: ["-"];

				return ipsList.map((ip, ipIdx) => ({
					id: `ac-log-${log.id}-${ip !== "-" ? ip : ipIdx}`,
					target: log.target,
					action: log.action,
					ipAddress: ip,
					reason: log.reason || "-",
					success: log.success,
					errorMessage: log.errorMessage,
					performedAt,
					timestamp,
				}));
			})
			.sort((a, b) => b.timestamp - a.timestamp);
	}, [visibleLogs]);

	// 화이트리스트 다중/단일 항목 추가 핸들러
	const handleAddWhitelist = async () => {
		const rawInput = newTargetsInput.trim();
		if (!rawInput) {
			const msg = t(($) => $.accessControl.toasts.invalidTarget);
			toast.add({ id: msg, title: msg, type: "error" });
			return;
		}

		// 쉼표, 줄바꿈, 세미콜론 등으로 구분
		const targets = rawInput
			.split(/[\r\n,;]+/)
			.map((s) => s.trim())
			.filter(Boolean);

		if (targets.length === 0) {
			const msg = t(($) => $.accessControl.toasts.invalidTarget);
			toast.add({ id: msg, title: msg, type: "error" });
			return;
		}

		const desc = whitelistDesc.trim() || t(($) => $.accessControl.defaults.manualWhitelistDesc);
		try {
			await addWhitelist(targets, desc);
			setNewTargetsInput("");
			setWhitelistDesc("");
			setIsAddDialogOpen(false);
			toast.add({
				title: t(($) => $.accessControl.toasts.whitelistAdded, { count: targets.length }),
				type: "success",
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			toast.add({
				id: message,
				title: message,
				type: "error",
			});
		}
	};

	// 항목 삭제 확인 핸들러
	const handleConfirmDelete = async () => {
		if (!itemToDelete) return;
		try {
			await removeWhitelist([itemToDelete.value], t(($) => $.accessControl.defaults.manualRemoveWhitelistReason));
			toast.add({
				title: t(($) => $.accessControl.toasts.whitelistRemoved),
				type: "success",
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			toast.add({
				id: message,
				title: message,
				type: "error",
			});
		} finally {
			setItemToDelete(null);
		}
	};

	// DNS 갱신(새로고침) 핸들러
	const handleRefreshWhitelist = async () => {
		try {
			await refreshWhitelist();
			toast.add({
				title: t(($) => $.accessControl.toasts.refreshSuccess),
				type: "success",
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			toast.add({
				id: message,
				title: message,
				type: "error",
			});
		}
	};

	// 화이트리스트 테이블 컬럼 정의
	const whitelistTargetColumnHelper = createColumnHelper<DataTableFeatures, WhitelistedTargetRecord>();
	const whitelistTargetColumns: ColumnDef<DataTableFeatures, WhitelistedTargetRecord>[] = useMemo(() => {
		return whitelistTargetColumnHelper.columns([
			{
				accessorKey: "type",
				header: () => <I18n i18nKey="accessControl.whitelistTable.columns.type"/>,
				cell: ({ row }) => {
					const type = row.original.type;
					let variant: "default" | "secondary" | "outline" = "outline";
					let label = type.toUpperCase();
					let icon = <Network className="size-3"/>;

					if (type === "ipv4") {
						variant = "secondary";
						label = "IPv4";
					} else if (type === "ipv6") {
						variant = "secondary";
						label = "IPv6";
					} else if (type === "domain") {
						variant = "outline";
						label = "Domain";
						icon = <Globe className="size-3"/>;
					} else if (type === "url") {
						variant = "default";
						label = "URL";
						icon = <Link2 className="size-3"/>;
					}

					return (
						<Badge variant={variant} className="gap-1 font-mono text-[11px] uppercase">
							{icon}
							<span>{label}</span>
						</Badge>
					);
				},
			},
			{
				accessorKey: "value",
				header: () => <I18n i18nKey="accessControl.whitelistTable.columns.target"/>,
				filterFn: (row, _columnId, filterValue) => {
					const q = String(filterValue ?? "").toLowerCase().trim();
					if (!q) return true;
					return (
						row.original.value.toLowerCase().includes(q) ||
						row.original.description.toLowerCase().includes(q) ||
						row.original.resolvedIps.some((ip) => ip.toLowerCase().includes(q))
					);
				},
				cell: ({ row }) => (
					<span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 break-all">
						{row.original.value}
					</span>
				),
			},
			{
				accessorKey: "port",
				header: () => <I18n i18nKey="accessControl.whitelistTable.columns.port"/>,
				cell: ({ row }) => {
					const port = row.original.port;
					if (port > 0) {
						return (
							<Badge variant="outline" className="font-mono text-xs">
								:{port}
							</Badge>
						);
					}
					return (
						<span className="text-xs text-muted-foreground">
							{t(($) => $.accessControl.whitelistTable.allPorts)}
						</span>
					);
				},
			},
			{
				accessorKey: "cidr",
				header: () => <I18n i18nKey="accessControl.whitelistTable.columns.cidr"/>,
				cell: ({ row }) => {
					const cidr = row.original.cidr;
					if (cidr !== undefined) {
						return <span className="font-mono text-xs text-muted-foreground">/{cidr}</span>;
					}
					return <span className="text-xs text-muted-foreground">-</span>;
				},
			},
			{
				accessorKey: "resolvedIps",
				header: () => <I18n i18nKey="accessControl.whitelistTable.columns.resolvedIps"/>,
				cell: ({ row }) => {
					const ips = row.original.resolvedIps;
					if (!ips || ips.length === 0) {
						return <span className="text-xs text-muted-foreground">-</span>;
					}
					return (
						<div className="flex flex-wrap gap-1 max-w-xs">
							{ips.map((ip) => (
								<Badge key={ip} variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
									{ip}
								</Badge>
							))}
						</div>
					);
				},
			},
			{
				accessorKey: "description",
				header: () => <I18n i18nKey="accessControl.whitelistTable.columns.description"/>,
				cell: ({ row }) => <span className="text-xs text-foreground/90">{row.original.description}</span>,
			},
			{
				accessorKey: "addedAt",
				header: () => <I18n i18nKey="accessControl.whitelistTable.columns.addedAt"/>,
				cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{row.original.addedAt}</span>,
			},
			{
				id: "actions",
				header: () => <I18n i18nKey="accessControl.whitelistTable.columns.actions"/>,
				cell: ({ row }) => (
					<div onClick={(e) => e.stopPropagation()}>
						<DropdownMenu>
							<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="cursor-pointer"/>}>
								<MoreHorizontal className="size-4"/>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									className="text-destructive cursor-pointer"
									onClick={() => setItemToDelete({ id: row.original.id, value: row.original.value })}
								>
									<Trash2 className="size-4 mr-2"/>
									<I18n i18nKey="accessControl.whitelistTable.removeAction"/>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				),
			},
		]);
	}, [whitelistTargetColumnHelper, t]);

	const tabsToolbar = (
		<Tabs
			value={activeTab}
			onValueChange={(val) => setActiveTab((val as "whitelisted-targets" | "blocked-processes" | "access-logs") ?? "whitelisted-targets")}
		>
			<TabsList>
				<TabsTrigger value="whitelisted-targets">
					<ShieldCheck className="text-emerald-600"/>
					<span>{t(($) => $.accessControl.tabs.whitelistedTargets, { count: whitelistedTargetsData.length })}</span>
				</TabsTrigger>
				<TabsTrigger value="blocked-processes">
					<ShieldAlert className="text-destructive"/>
					<span>
						{t(($) => $.accessControl.tabs.blockedProcesses, {
							count: Math.max(totalCounts.blockedProcesses, blockedProcessesData.length),
						})}
					</span>
				</TabsTrigger>
				<TabsTrigger value="access-logs">
					<History className="text-muted-foreground"/>
					<span>
						{t(($) => $.accessControl.tabs.accessLogs, {
							count: Math.max(totalCounts.accessControlLogs, accessLogsData.length),
						})}
					</span>
				</TabsTrigger>
			</TabsList>
		</Tabs>
	);

	return (
		<div className="flex flex-col gap-6 min-w-0">
			{/* 페이지 상단 헤더 */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">
						{t(($) => $.accessControl.heading)}
					</h2>
					<p className="text-sm text-muted-foreground">
						{t(($) => $.accessControl.description)}
					</p>
				</div>
			</div>

			{/* WFP 방화벽 전체 차단 상태 및 컨트롤 배너 카드 */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
				<div className="flex items-start gap-3.5">
					<div className={`mt-0.5 rounded-lg p-2.5 ${isFirewallActive ? "bg-destructive/15 text-destructive" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"}`}>
						{isFirewallActive ? <ShieldBan className="size-6"/> : <ShieldCheck className="size-6"/>}
					</div>
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<Badge variant={isFirewallActive ? "destructive" : "secondary"} className="gap-1.5 text-xs font-semibold">
								{isFirewallActive ? (
									<>
										<ShieldBan className="size-3.5"/>
										{t(($) => $.accessControl.statusActive)}
									</>
								) : (
									<>
										<ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400"/>
										{t(($) => $.accessControl.statusInactive)}
									</>
								)}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
							{isFirewallActive
								? t(($) => $.accessControl.statusActiveDesc)
								: t(($) => $.accessControl.statusInactiveDesc)}
						</p>
					</div>
				</div>

				{/* 컨트롤 액션 버튼 그룹 */}
				<div className="flex items-center gap-2 shrink-0 self-end md:self-center">
					{/* DNS IP 새로고침 버튼 */}
					<Button
						variant="outline"
						size="sm"
						className="gap-1.5 cursor-pointer"
						onClick={handleRefreshWhitelist}
						disabled={isRefreshing}
					>
						<RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}/>
						<span>{isRefreshing ? t(($) => $.accessControl.refreshing) : t(($) => $.accessControl.refreshButton)}</span>
					</Button>

					{/* 화이트리스트 등록 모달 버튼 */}
					<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
						<DialogTrigger render={<Button size="sm" className="gap-1.5 cursor-pointer"/>}>
							<Plus className="size-4"/>
							<span>{t(($) => $.accessControl.addPolicy)}</span>
						</DialogTrigger>
						<DialogContent className="sm:max-w-lg">
							<DialogHeader>
								<DialogTitle>
									{t(($) => $.accessControl.dialog.whitelistTitle)}
								</DialogTitle>
								<DialogDescription>
									{t(($) => $.accessControl.dialog.description)}
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4 py-2">
								<Field>
									<FieldLabel>{t(($) => $.accessControl.dialog.whitelistIpLabel)}</FieldLabel>
									<Textarea
										rows={3}
										placeholder={t(($) => $.accessControl.dialog.whitelistIpPlaceholder)}
										value={newTargetsInput}
										onChange={(e) => setNewTargetsInput(e.target.value)}
										className="font-mono text-xs"
									/>
									<p className="text-[11px] text-muted-foreground mt-1">
										{t(($) => $.accessControl.dialog.helpExamples)}
									</p>
								</Field>
								<Field>
									<FieldLabel>{t(($) => $.accessControl.dialog.whitelistDescLabel)}</FieldLabel>
									<Input
										placeholder={t(($) => $.accessControl.dialog.whitelistDescPlaceholder)}
										value={whitelistDesc}
										onChange={(e) => setWhitelistDesc(e.target.value)}
									/>
								</Field>
							</div>

							<DialogFooter>
								<DialogClose render={<Button variant="outline"/>}>
									{t(($) => $.accessControl.dialog.cancel)}
								</DialogClose>
								<Button onClick={handleAddWhitelist}>
									{t(($) => $.accessControl.dialog.submit)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* 탭 1: 허용 대상 목록 (화이트리스트) */}
			{activeTab === "whitelisted-targets" && (
				<DataTable
					heading={t(($) => $.accessControl.whitelistTable.heading)}
					columns={whitelistTargetColumns}
					data={whitelistedTargetsData}
					isLoading={storeIsLoading}
					enableSearch={true}
					enableRowNumber={true}
					highlightedRowId={ruleHighlightedRowId}
					onHighlightEnd={() => setRuleHighlightedRowId(null)}
					filterPlaceholder={t(($) => $.accessControl.whitelistTable.searchPlaceholder)}
					filterColumnKey="value"
					maxHeight="calc(100vh - 25rem)"
					onRowClick={(row) => {
						setSelectedWhitelistItem(row);
						setIsWhitelistSheetOpen(true);
					}}
				>
					{tabsToolbar}
				</DataTable>
			)}

			{/* 탭 2: 프로세스 차단 목록 (읽기 전용) */}
			{activeTab === "blocked-processes" && (
				<DataTable
					heading={t(($) => $.accessControl.blockedProcessesTable.heading)}
					columns={blockedProcessesColumns}
					data={blockedProcessesData}
					enableSearch={true}
					enableRowNumber={true}
					hasMore={hasMoreAlerts}
					isLoadingMore={isLoadingMoreAlerts}
					onLoadMore={fetchMoreAlerts}
					filterPlaceholder={t(($) => $.accessControl.blockedProcessesTable.searchPlaceholder)}
					filterColumnKey="processName"
					maxHeight="calc(100vh - 25rem)"
				>
					{tabsToolbar}
				</DataTable>
			)}

			{/* 탭 3: 접근 제어 로그 */}
			{activeTab === "access-logs" && (
				<DataTable
					heading={t(($) => $.accessControl.logsTable.heading)}
					columns={logsColumns}
					data={accessLogsData}
					isLoading={storeIsLoading}
					enableSearch={true}
					enableRowNumber={true}
					rowNumberOffset={logsTopOffset}
					hasMoreTop={logsHasMoreTop}
					hasMoreBottom={logsHasMoreBottom}
					isLoadingMoreTop={logsIsLoadingTop}
					isLoadingMoreBottom={logsIsLoadingBottom}
					onLoadMoreTop={() => loadMoreLogs("newer")}
					onLoadMoreBottom={() => loadMoreLogs("older")}
					highlightedRowId={logHighlightedRowId}
					onHighlightEnd={() => setLogHighlightedRowId(null)}
					filterPlaceholder={t(($) => $.accessControl.logsTable.searchPlaceholder)}
					filterColumnKey="ipAddress"
					maxHeight="calc(100vh - 25rem)"
				>
					{tabsToolbar}
				</DataTable>
			)}

			{/* 삭제 확인 AlertDialog */}
			<AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t(($) => $.accessControl.deleteDialog.title)}</AlertDialogTitle>
						<AlertDialogDescription>
							{t(($) => $.accessControl.deleteDialog.description, { item: itemToDelete?.value ?? "" })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t(($) => $.accessControl.deleteDialog.cancel)}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t(($) => $.accessControl.deleteDialog.confirm)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* 화이트리스트 행 클릭 시 우측에서 슬라이드 오픈되는 상세 패널 Sheet */}
			<Sheet open={isWhitelistSheetOpen} onOpenChange={setIsWhitelistSheetOpen}>
				<SheetContent side="right" className="sm:max-w-md w-full p-0 overflow-hidden">
					<SheetHeader className="p-6 pb-4 border-b shrink-0">
						<SheetTitle className="flex items-center gap-2 text-base font-bold">
							<ShieldCheck className="size-5 text-emerald-600"/>
							<span>{t(($) => $.accessControl.sheet.title)}</span>
						</SheetTitle>
						<SheetDescription className="text-xs break-all">
							{t(($) => $.accessControl.sheet.description, {
								type: selectedWhitelistItem?.type.toUpperCase() ?? "-",
								value: selectedWhitelistItem?.value ?? "-",
							})}
						</SheetDescription>
					</SheetHeader>

					{selectedWhitelistItem && (
						<ScrollArea className="flex-1 min-h-0">
							<div className="space-y-4 px-6 py-4 text-xs">
								{/* 기본 정보 카드 */}
								<div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg border">
									<div>
										<span className="text-muted-foreground flex items-center gap-1 mb-1">
											<Network className="size-3"/> {t(($) => $.accessControl.sheet.type)}
										</span>
										<Badge variant="secondary" className="font-mono text-[10px] uppercase">
											{selectedWhitelistItem.type}
										</Badge>
									</div>

									<div>
										<span className="text-muted-foreground flex items-center gap-1 mb-1">
											<Globe className="size-3"/> {t(($) => $.accessControl.sheet.port)}
										</span>
										<span className="font-mono font-bold">
											{selectedWhitelistItem.port > 0
												? `:${selectedWhitelistItem.port}`
												: `${t(($) => $.accessControl.whitelistTable.allPorts)} (0)`}
										</span>
									</div>

									<div>
										<span className="text-muted-foreground flex items-center gap-1 mb-1">
											<Network className="size-3"/> {t(($) => $.accessControl.sheet.cidr)}
										</span>
										<span className="font-mono font-medium">
											{selectedWhitelistItem.cidr !== undefined ? `/${selectedWhitelistItem.cidr}` : "-"}
										</span>
									</div>

									<div>
										<span className="text-muted-foreground flex items-center gap-1 mb-1">
											<Clock className="size-3"/> {t(($) => $.accessControl.sheet.addedAt)}
										</span>
										<span className="font-mono font-medium">{selectedWhitelistItem.addedAt}</span>
									</div>
								</div>

								{/* 허용 대상 입력값 */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
										<Link2 className="size-3.5"/> {t(($) => $.accessControl.sheet.targetValue)}
									</label>
									<div className="p-2.5 bg-background border rounded-md font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 break-all leading-normal">
										{selectedWhitelistItem.value}
									</div>
								</div>

								{/* IPC data 상세 필드: IPv4 / IPv6 */}
								{(selectedWhitelistItem.ipv4 || selectedWhitelistItem.ipv6) && (
									<div className="space-y-1.5">
										<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
											<Network className="size-3.5"/> {t(($) => $.accessControl.sheet.ipAddress)}
										</label>
										<div className="p-2.5 bg-background border rounded-md font-mono text-xs break-all">
											{selectedWhitelistItem.ipv4 || selectedWhitelistItem.ipv6}
										</div>
									</div>
								)}

								{/* IPC data 상세 필드: Domain / URL */}
								{selectedWhitelistItem.domain && (
									<>
										<div className="space-y-1.5">
											<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
												<Globe className="size-3.5"/> {t(($) => $.accessControl.sheet.domain)}
											</label>
											<div className="p-2.5 bg-background border rounded-md font-mono text-xs break-all">
												{selectedWhitelistItem.domain}
											</div>
										</div>

										<div className="space-y-1.5">
											<label className="text-xs font-semibold text-muted-foreground">
												{t(($) => $.accessControl.sheet.ipv4List)} ({selectedWhitelistItem.ipv4List?.length ?? 0})
											</label>
											<div className="p-2.5 bg-background border rounded-md flex flex-wrap gap-1.5">
												{selectedWhitelistItem.ipv4List && selectedWhitelistItem.ipv4List.length > 0 ? (
													selectedWhitelistItem.ipv4List.map((ip) => (
														<Badge key={ip} variant="secondary" className="font-mono text-[11px]">
															{ip}
														</Badge>
													))
												) : (
													<span className="text-muted-foreground">{t(($) => $.accessControl.sheet.none)}</span>
												)}
											</div>
										</div>

										<div className="space-y-1.5">
											<label className="text-xs font-semibold text-muted-foreground">
												{t(($) => $.accessControl.sheet.ipv6List)} ({selectedWhitelistItem.ipv6List?.length ?? 0})
											</label>
											<div className="p-2.5 bg-background border rounded-md flex flex-wrap gap-1.5">
												{selectedWhitelistItem.ipv6List && selectedWhitelistItem.ipv6List.length > 0 ? (
													selectedWhitelistItem.ipv6List.map((ip) => (
														<Badge key={ip} variant="secondary" className="font-mono text-[11px]">
															{ip}
														</Badge>
													))
												) : (
													<span className="text-muted-foreground">{t(($) => $.accessControl.sheet.none)}</span>
												)}
											</div>
										</div>
									</>
								)}

								{/* 설명 / 식별 사유 */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground">
										{t(($) => $.accessControl.sheet.ruleDescription)}
									</label>
									<div className="p-2.5 bg-background border rounded-md text-xs text-foreground/90">
										{selectedWhitelistItem.description}
									</div>
								</div>

								{/* IPC 응답 data 객체 JSON */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
										<FileText className="size-3.5"/> {t(($) => $.accessControl.sheet.ipcData)}
									</label>
									<ScrollArea className="max-h-60 rounded-md border bg-muted/80">
										<pre className="p-3 font-mono text-[11px] whitespace-pre-wrap break-all leading-relaxed text-foreground/90">
											{JSON.stringify(selectedWhitelistItem.data, null, 2)}
										</pre>
									</ScrollArea>
								</div>

								{/* 전체 Raw WhitelistItem JSON */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
										<FileText className="size-3.5"/> {t(($) => $.accessControl.sheet.rawJson)}
									</label>
									<ScrollArea className="max-h-60 rounded-md border bg-muted/80">
										<pre className="p-3 font-mono text-[11px] whitespace-pre-wrap break-all leading-relaxed text-foreground/90">
											{JSON.stringify(selectedWhitelistItem.rawItem, null, 2)}
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
