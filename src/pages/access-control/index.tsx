import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import {
	Plus,
	Trash2,
	MoreHorizontal,
	ShieldX,
	ShieldCheck,
	ShieldAlert,
	History,
	CheckCircle2,
	XCircle,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type DataTableFeatures } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAccessControlStore, useAlertStore } from "@/store";



const IPV4_REG = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.){3}(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)$/;



// Data types for rendering
export interface BlockedIpRecord {
	id: string;
	ipAddress: string;
	reason: string;
	blockedAt: string;
}

export interface WhitelistedIpRecord {
	id: string;
	ipAddress: string;
	description: string;
	addedAt: string;
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

	const storeBlockedIps = useAccessControlStore((state) => state.blockedIps);
	const storeWhitelist = useAccessControlStore((state) => state.whitelistIps);
	const storeLogs = useAccessControlStore((state) => state.logs);
	const storeIsLoading = useAccessControlStore((state) => state.isLoading);
	const fetchRules = useAccessControlStore((state) => state.fetchRules);
	const blockIp = useAccessControlStore((state) => state.blockIp);
	const unblockIp = useAccessControlStore((state) => state.unblockIp);
	const addWhitelist = useAccessControlStore((state) => state.addWhitelist);
	const removeWhitelist = useAccessControlStore((state) => state.removeWhitelist);

	const rawAlerts = useAlertStore((state) => state.alerts);

	useEffect(() => {
		fetchRules();
	}, [fetchRules]);

	const [activeTab, setActiveTab] = useState("blocked-ips");

	// Dialog Inputs
	const [newBlockedIp, setNewBlockedIp] = useState("");
	const [blockedReason, setBlockedReason] = useState("");
	const [newWhitelistIp, setNewWhitelistIp] = useState("");
	const [whitelistDesc, setWhitelistDesc] = useState("");

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<{ id: string; ipOrPath: string; type: "blocked" | "whitelisted" } | null>(null);

	// Map store items to UI tables
	const blockedIpsData: BlockedIpRecord[] = storeBlockedIps.map((ip) => {
		const matchedLog = storeLogs
			.filter((log) => {
				if (log.target !== "block" || log.action !== "add") return false;
				if (log.ip === ip) return true;
				const maybeIps = (log as { ips?: string[] | null }).ips;
				return Array.isArray(maybeIps) && maybeIps.includes(ip);
			})
			.sort((a, b) => b.performedAt - a.performedAt)[0];

		return {
			id: matchedLog ? `${matchedLog.id}-${ip}` : ip,
			ipAddress: ip,
			reason: matchedLog?.reason || t(($) => $.accessControl.defaults.manualBlockReason),
			blockedAt: matchedLog?.performedAt ? new Date(matchedLog.performedAt).toLocaleString() : "-",
		};
	});

	const whitelistedIpsData: WhitelistedIpRecord[] = storeWhitelist.map((ip) => {
		const matchedLog = storeLogs
			.filter((log) => {
				if (log.target !== "whitelist" || log.action !== "add") return false;
				if (log.ip === ip) return true;
				const maybeIps = (log as { ips?: string[] | null }).ips;
				return Array.isArray(maybeIps) && maybeIps.includes(ip);
			})
			.sort((a, b) => b.performedAt - a.performedAt)[0];

		return {
			id: matchedLog ? `${matchedLog.id}-${ip}` : ip,
			ipAddress: ip,
			description: matchedLog?.reason || t(($) => $.accessControl.defaults.manualWhitelistDesc),
			addedAt: matchedLog?.performedAt ? new Date(matchedLog.performedAt).toLocaleString() : "-",
		};
	});

	const blockedProcessesData: BlockedProcessRecord[] = rawAlerts
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

	const accessLogsData: AccessControlLogRecord[] = storeLogs
		.flatMap((log, idx) => {
			const timestamp = log.performedAt;
			const performedAt = timestamp ? new Date(timestamp).toLocaleString() : "-";
			const maybeIps = (log as { ips?: string[] | null }).ips;
			const ipsList = log.ip
				? [log.ip]
				: Array.isArray(maybeIps) && maybeIps.length > 0
					? maybeIps
					: ["-"];

			return ipsList.map((ip, ipIdx) => ({
				id: `ac-log-${log.id}-${idx}-${ipIdx}`,
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

	// Add new Blocked IP
	const handleAddBlockedIp = async () => {
		if (!IPV4_REG.test(newBlockedIp.trim())) {
			const msg = t(($) => $.accessControl.toasts.invalidIp);
			toast.add({ id: msg, title: msg, type: "error" });
			return;
		}
		const ip = newBlockedIp.trim();
		const reason = blockedReason.trim() || t(($) => $.accessControl.defaults.manualBlockReason);
		try {
			await blockIp([ip], reason);
			setNewBlockedIp("");
			setBlockedReason("");
			setIsAddDialogOpen(false);
			toast.add({ title: t(($) => $.accessControl.toasts.blockedAdded, { ip }), type: "success" });
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			toast.add({
				id: message,
				title: message,
				type: "error",
			});
		}
	};

	// Add new Whitelisted IP
	const handleAddWhitelistedIp = async () => {
		if (!IPV4_REG.test(newWhitelistIp.trim())) {
			const msg = t(($) => $.accessControl.toasts.invalidIp);
			toast.add({ id: msg, title: msg, type: "error" });
			return;
		}
		const ip = newWhitelistIp.trim();
		const desc = whitelistDesc.trim() || t(($) => $.accessControl.defaults.manualWhitelistDesc);
		try {
			await addWhitelist([ip], desc);
			setNewWhitelistIp("");
			setWhitelistDesc("");
			setIsAddDialogOpen(false);
			toast.add({ title: t(($) => $.accessControl.toasts.whitelistAdded, { ip }), type: "success" });
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			toast.add({
				id: message,
				title: message,
				type: "error",
			});
		}
	};

	// Confirm delete
	const handleConfirmDelete = async () => {
		if (!itemToDelete) return;
		try {
			if (itemToDelete.type === "blocked") {
				await unblockIp([itemToDelete.ipOrPath], t(($) => $.accessControl.defaults.manualUnblockReason));
				toast.add({ title: t(($) => $.accessControl.toasts.blockedRemoved, { ip: itemToDelete.ipOrPath }), type: "success" });
			} else if (itemToDelete.type === "whitelisted") {
				await removeWhitelist([itemToDelete.ipOrPath], t(($) => $.accessControl.defaults.manualRemoveWhitelistReason));
				toast.add({ title: t(($) => $.accessControl.toasts.whitelistRemoved, { ip: itemToDelete.ipOrPath }), type: "success" });
			}
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

	// Table column definitions
	const blockedColumnHelper = createColumnHelper<DataTableFeatures, BlockedIpRecord>();
	const blockedColumns: ColumnDef<DataTableFeatures, BlockedIpRecord>[] = blockedColumnHelper.columns([
		{
			accessorKey: "ipAddress",
			header: () => <I18n i18nKey="accessControl.blockedTable.columns.ipAddress"/>,
			cell: ({ row }) => <span className="font-mono font-bold text-destructive">{row.original.ipAddress}</span>,
		},
		{
			accessorKey: "reason",
			header: () => <I18n i18nKey="accessControl.blockedTable.columns.reason"/>,
			cell: ({ row }) => <span>{row.original.reason}</span>,
		},
		{
			accessorKey: "blockedAt",
			header: () => <I18n i18nKey="accessControl.blockedTable.columns.blockedAt"/>,
			cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.blockedAt}</span>,
		},
		{
			id: "actions",
			header: () => <I18n i18nKey="accessControl.blockedTable.columns.actions"/>,
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="cursor-pointer"/>}>
						<MoreHorizontal className="size-4"/>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							className="text-destructive cursor-pointer"
							onClick={() => setItemToDelete({ id: row.original.id, ipOrPath: row.original.ipAddress, type: "blocked" })}
						>
							<Trash2 className="size-4 mr-2"/>
							<I18n i18nKey="accessControl.blockedTable.unblockAction"/>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	]);

	const whitelistColumnHelper = createColumnHelper<DataTableFeatures, WhitelistedIpRecord>();
	const whitelistColumns: ColumnDef<DataTableFeatures, WhitelistedIpRecord>[] = whitelistColumnHelper.columns([
		{
			accessorKey: "ipAddress",
			header: () => <I18n i18nKey="accessControl.whitelistTable.columns.ipAddress"/>,
			cell: ({ row }) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{row.original.ipAddress}</span>,
		},
		{
			accessorKey: "description",
			header: () => <I18n i18nKey="accessControl.whitelistTable.columns.description"/>,
			cell: ({ row }) => <span>{row.original.description}</span>,
		},
		{
			accessorKey: "addedAt",
			header: () => <I18n i18nKey="accessControl.whitelistTable.columns.addedAt"/>,
			cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.addedAt}</span>,
		},
		{
			id: "actions",
			header: () => <I18n i18nKey="accessControl.whitelistTable.columns.actions"/>,
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="cursor-pointer"/>}>
						<MoreHorizontal className="size-4"/>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							className="text-destructive cursor-pointer"
							onClick={() => setItemToDelete({ id: row.original.id, ipOrPath: row.original.ipAddress, type: "whitelisted" })}
						>
							<Trash2 className="size-4 mr-2"/>
							<I18n i18nKey="accessControl.whitelistTable.removeAction"/>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	]);

	const isWhitelistDialog = activeTab === "whitelisted-ips";
	const canAddPolicy = activeTab === "blocked-ips" || activeTab === "whitelisted-ips";

	return (
		<div className="flex flex-col gap-6 min-w-0">
			{/* 페이지 서머리 헤더 */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">
						{t(($) => $.accessControl.heading)}
					</h2>
					<p className="text-sm text-muted-foreground">
						{t(($) => $.accessControl.description)}
					</p>
				</div>

				{/* 신규 정책 등록 Dialog 모달 (IP 차단 / 허용 탭에서만 표시) */}
				{canAddPolicy && (
					<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
						<DialogTrigger render={<Button size="sm" className="gap-1.5 cursor-pointer"/>}>
							<Plus className="size-4"/>
							<span>{t(($) => $.accessControl.addPolicy)}</span>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>
									{!isWhitelistDialog
										? t(($) => $.accessControl.dialog.blockTitle)
										: t(($) => $.accessControl.dialog.whitelistTitle)}
								</DialogTitle>
								<DialogDescription>
									{t(($) => $.accessControl.dialog.description)}
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4 py-2">
								{!isWhitelistDialog ? (
									<>
										<Field>
											<FieldLabel>{t(($) => $.accessControl.dialog.blockIpLabel)}</FieldLabel>
											<Input
												placeholder={t(($) => $.accessControl.dialog.blockIpPlaceholder)}
												value={newBlockedIp}
												onChange={(e) => setNewBlockedIp(e.target.value)}
											/>
										</Field>
										<Field>
											<FieldLabel>{t(($) => $.accessControl.dialog.blockReasonLabel)}</FieldLabel>
											<Input
												placeholder={t(($) => $.accessControl.dialog.blockReasonPlaceholder)}
												value={blockedReason}
												onChange={(e) => setBlockedReason(e.target.value)}
											/>
										</Field>
									</>
								) : (
									<>
										<Field>
											<FieldLabel>{t(($) => $.accessControl.dialog.whitelistIpLabel)}</FieldLabel>
											<Input
												placeholder={t(($) => $.accessControl.dialog.whitelistIpPlaceholder)}
												value={newWhitelistIp}
												onChange={(e) => setNewWhitelistIp(e.target.value)}
											/>
										</Field>
										<Field>
											<FieldLabel>{t(($) => $.accessControl.dialog.whitelistDescLabel)}</FieldLabel>
											<Input
												placeholder={t(($) => $.accessControl.dialog.whitelistDescPlaceholder)}
												value={whitelistDesc}
												onChange={(e) => setWhitelistDesc(e.target.value)}
											/>
										</Field>
									</>
								)}
							</div>

							<DialogFooter>
								<DialogClose render={<Button variant="outline"/>}>
									{t(($) => $.accessControl.dialog.cancel)}
								</DialogClose>
								<Button
									onClick={
										!isWhitelistDialog
											? handleAddBlockedIp
											: handleAddWhitelistedIp
									}
								>
									{t(($) => $.accessControl.dialog.submit)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				)}
			</div>

			{/* 카테고리 분리 Tabs */}
			<Tabs value={activeTab} onValueChange={(val) => setActiveTab(val ?? "blocked-ips")} className="w-full">
				<TabsList>
					<TabsTrigger value="blocked-ips">
						<ShieldX className="text-destructive"/>
						<span>{t(($) => $.accessControl.tabs.blockedIps, { count: blockedIpsData.length })}</span>
					</TabsTrigger>
					<TabsTrigger value="whitelisted-ips">
						<ShieldCheck className="text-emerald-600"/>
						<span>{t(($) => $.accessControl.tabs.whitelistedIps, { count: whitelistedIpsData.length })}</span>
					</TabsTrigger>
					<TabsTrigger value="blocked-processes">
						<ShieldAlert className="text-destructive"/>
						<span>{t(($) => $.accessControl.tabs.blockedProcesses, { count: blockedProcessesData.length })}</span>
					</TabsTrigger>
					<TabsTrigger value="access-logs">
						<History className="text-muted-foreground"/>
						<span>{t(($) => $.accessControl.tabs.accessLogs, { count: accessLogsData.length })}</span>
					</TabsTrigger>
				</TabsList>

				{/* 탭 1: 방화벽 차단 IP */}
				<TabsContent value="blocked-ips">
					<DataTable
						heading={t(($) => $.accessControl.blockedTable.heading)}
						columns={blockedColumns}
						data={blockedIpsData}
						isLoading={storeIsLoading}
						enableSearch={true}
						enablePagination={true}
						enableRowNumber={true}
						filterPlaceholder={t(($) => $.accessControl.blockedTable.searchPlaceholder)}
						filterColumnKey="ipAddress"
					/>
				</TabsContent>

				{/* 탭 2: 방화벽 허용 IP (화이트리스트) */}
				<TabsContent value="whitelisted-ips">
					<DataTable
						heading={t(($) => $.accessControl.whitelistTable.heading)}
						columns={whitelistColumns}
						data={whitelistedIpsData}
						isLoading={storeIsLoading}
						enableSearch={true}
						enablePagination={true}
						enableRowNumber={true}
						filterPlaceholder={t(($) => $.accessControl.whitelistTable.searchPlaceholder)}
						filterColumnKey="ipAddress"
					/>
				</TabsContent>

				{/* 탭 3: 프로세스 차단 목록 (읽기 전용) */}
				<TabsContent value="blocked-processes">
					<DataTable
						heading={t(($) => $.accessControl.blockedProcessesTable.heading)}
						columns={blockedProcessesColumns}
						data={blockedProcessesData}
						enableSearch={true}
						enablePagination={true}
						enableRowNumber={true}
						filterPlaceholder={t(($) => $.accessControl.blockedProcessesTable.searchPlaceholder)}
						filterColumnKey="processName"
					/>
				</TabsContent>

				{/* 탭 4: 접근 제어 로그 */}
				<TabsContent value="access-logs">
					<DataTable
						heading={t(($) => $.accessControl.logsTable.heading)}
						columns={logsColumns}
						data={accessLogsData}
						isLoading={storeIsLoading}
						enableSearch={true}
						enablePagination={true}
						enableRowNumber={true}
						filterPlaceholder={t(($) => $.accessControl.logsTable.searchPlaceholder)}
						filterColumnKey="ipAddress"
					/>
				</TabsContent>
			</Tabs>

			{/* 삭제 확인 AlertDialog */}
			<AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t(($) => $.accessControl.deleteDialog.title)}</AlertDialogTitle>
						<AlertDialogDescription>
							{t(($) => $.accessControl.deleteDialog.description, { item: itemToDelete?.ipOrPath ?? "" })}
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
		</div>
	);
}
