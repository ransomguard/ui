import { useState } from "react";
import { useNavigate } from "react-router";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import {
	ShieldAlert,
	RefreshCw,
	Activity,
	Shield,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableFeatures } from "@/components/data-table";
import { I18n } from "@/components/i18n";



export type DashboardEventCategory = "threat" | "recovery" | "telemetry" | "firewall";

export interface DashboardSummaryEventItem {
	id: string;
	category: DashboardEventCategory;
	action: string;
	target: string;
	summary: string;
	timestamp: number;
	createdAt: string;
}

const CATEGORY_ROUTES: Record<DashboardEventCategory, string> = {
	threat: "/alerts",
	recovery: "/alerts",
	telemetry: "/telemetry",
	firewall: "/access-control",
};

const columnHelper = createColumnHelper<DataTableFeatures, DashboardSummaryEventItem>();

const summaryColumns: ColumnDef<DataTableFeatures, DashboardSummaryEventItem>[] = columnHelper.columns([
	{
		accessorKey: "category",
		meta: {
			className: "w-28",
		},
		header: () => <I18n i18nKey="recentEvents.columns.category"/>,
		cell: ({ row }) => {
			const { category } = row.original;

			if (category === "threat") {
				return (
					<Badge variant="destructive" className="gap-1">
						<ShieldAlert className="size-3"/>
						<I18n i18nKey="recentEvents.categories.threat"/>
					</Badge>
				);
			}

			if (category === "recovery") {
				return (
					<Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
						<RefreshCw className="size-3"/>
						<I18n i18nKey="recentEvents.categories.recovery"/>
					</Badge>
				);
			}

			if (category === "telemetry") {
				return (
					<Badge variant="secondary" className="gap-1">
						<Activity className="size-3"/>
						<I18n i18nKey="recentEvents.categories.telemetry"/>
					</Badge>
				);
			}

			return (
				<Badge variant="outline" className="gap-1">
					<Shield className="size-3"/>
					<I18n i18nKey="recentEvents.categories.firewall"/>
				</Badge>
			);
		},
	},
	{
		accessorKey: "action",
		meta: {
			className: "w-40",
		},
		header: () => <I18n i18nKey="recentEvents.columns.action"/>,
		cell: ({ row }) => {
			const { category, action } = row.original;
			const variant =
				category === "threat" || action === "BLOCK_ADD" || action === "RESTORE_FAILED"
					? "destructive"
					: category === "recovery"
						? "default"
						: "outline";

			return (
				<Badge variant={variant} className="font-mono text-[11px]">
					{action}
				</Badge>
			);
		},
	},
	{
		accessorKey: "target",
		meta: {
			className: "max-w-48 truncate",
		},
		header: () => <I18n i18nKey="recentEvents.columns.target"/>,
		cell: ({ row }) => (
			<span className="font-mono text-xs font-medium truncate block">
				{row.original.target}
			</span>
		),
	},
	{
		accessorKey: "summary",
		meta: {
			className: "w-full max-w-md truncate",
		},
		header: () => <I18n i18nKey="recentEvents.columns.summary"/>,
		filterFn: (row, _columnId, filterValue) => {
			const query = String(filterValue ?? "").toLowerCase().trim();
			if (!query) return true;
			return (
				row.original.target.toLowerCase().includes(query) ||
				row.original.summary.toLowerCase().includes(query) ||
				row.original.action.toLowerCase().includes(query)
			);
		},
		cell: ({ row }) => (
			<span className="text-foreground/90 truncate block">
				{row.original.summary}
			</span>
		),
	},
	{
		accessorKey: "createdAt",
		meta: {
			className: "text-right whitespace-nowrap",
		},
		header: () => <I18n i18nKey="recentEvents.columns.timestamp"/>,
		cell: ({ row }) => (
			<div className="text-muted-foreground font-mono text-xs">
				{row.original.createdAt}
			</div>
		),
	},
]);



export interface RecentEventsSectionProps {
	data: DashboardSummaryEventItem[];
	isLoading?: boolean;
}

export default function RecentEventsSection({
	data,
	isLoading,
}: RecentEventsSectionProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [activeTab, setActiveTab] = useState<"all" | DashboardEventCategory>("all");

	const filteredData = activeTab === "all"
		? data
		: data.filter((item) => item.category === activeTab);

	const counts = {
		all: data.length,
		threat: data.filter((i) => i.category === "threat").length,
		recovery: data.filter((i) => i.category === "recovery").length,
		telemetry: data.filter((i) => i.category === "telemetry").length,
		firewall: data.filter((i) => i.category === "firewall").length,
	};

	return (
		<DataTable
			heading={t(($) => $.recentEvents.heading)}
			columns={summaryColumns}
			data={filteredData}
			isLoading={isLoading}
			filterPlaceholder={t(($) => $.recentEvents.searchPlaceholder)}
			filterColumnKey="summary"
			onRowClick={(row) => navigate(CATEGORY_ROUTES[row.category])}
			enableSearch
			enablePagination
			enableRowNumber
		>
			<Tabs
				value={activeTab}
				onValueChange={(val) => setActiveTab((val as "all" | DashboardEventCategory) ?? "all")}
			>
				<TabsList>
					<TabsTrigger value="all">
						{t(($) => $.recentEvents.tabs.all)} ({counts.all})
					</TabsTrigger>
					<TabsTrigger value="threat">
						{t(($) => $.recentEvents.tabs.threat)} ({counts.threat})
					</TabsTrigger>
					<TabsTrigger value="recovery">
						{t(($) => $.recentEvents.tabs.recovery)} ({counts.recovery})
					</TabsTrigger>
					<TabsTrigger value="telemetry">
						{t(($) => $.recentEvents.tabs.telemetry)} ({counts.telemetry})
					</TabsTrigger>
					<TabsTrigger value="firewall">
						{t(($) => $.recentEvents.tabs.firewall)} ({counts.firewall})
					</TabsTrigger>
				</TabsList>
			</Tabs>
		</DataTable>
	);
}
