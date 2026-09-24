import { useState } from "react";
import { Plus, ShieldAlert, Trash2 } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";

import * as api from "@/lib/api";
import * as random from "@/lib/random";
import type { FlattenedKeys } from "@/locales";

import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
	Field,
	FieldLabel,
} from "@/components/ui/field";
import { DataTable, type DataTableFeatures } from "@/components/data-table";
import { I18n } from "@/components/i18n";



const columnHelper = createColumnHelper<DataTableFeatures, api.BlockedIpItem>();

const ipBlockColumns: ColumnDef<DataTableFeatures, api.BlockedIpItem>[] = columnHelper.columns([
	{
		accessorKey: "ipAddress",
		header: () =>  <I18n i18nKey={"ipBlock.columns.ipAddress"}/>,
		cell: ({ row }) => (
			<span className="font-mono font-medium">{row.original.ipAddress}</span>
		),
	},
	{
		accessorKey: "type",
		meta: {
			className: "text-center",
		},
		header: () =>  <I18n i18nKey={"ipBlock.columns.blockType"}/>,
		cell: ({ row }) => (
			<I18n
				prefix="ipBlock.type"
				i18nKey={row.original.type === "manual" ? "manual" : "auto"}
				render={<Badge
					variant={row.original.type === "manual" ? "secondary" : "destructive"}
				/>}
			/>
		),
	},
	{
		accessorKey: "reason",
		meta: {
			className: "w-full max-w-xs truncate",
		},
		header: () => <I18n i18nKey={"ipBlock.columns.reason"}/>,
		cell: ({ row }) => (
			<span className="text-foreground/90">{row.original.reason}</span>
		),
	},
	{
		accessorKey: "blockedAt",
		meta: {
			className: "text-right",
		},
		header: () => <I18n i18nKey={"ipBlock.columns.blockedAt"}/>,
		cell: ({ row }) => (
			<div className="text-muted-foreground font-mono">
				{row.original.blockedAt}
			</div>
		),
	},
]);



const IPV4_REG = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.){3}(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)$/;
const validateIp = (ip: string) => IPV4_REG.test(ip.trim());

export interface IpBlockSectionProps {
	data: api.BlockedIpItem[];
	addItem: (value: api.BlockedIpItem | null) => void;
	removeItem: (value: api.BlockedIpItem | null) => void;
	isLoading?: boolean;
}

export default function IpBlockSection({
	data,
	addItem,
	removeItem,
	isLoading,
}: IpBlockSectionProps) {
	const { t } = useTranslation();

	const [selectedRows, setSelectedRows] = useState<api.BlockedIpItem[]>([]);

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [newIp, setNewIp] = useState("");
	const [newReason, setNewReason] = useState("");

	const handleAddIp = () => {
		const trimmedIp = newIp.trim();
		let errorKey: FlattenedKeys<"ipBlock.errors"> | null = null;
		if (!trimmedIp) {
			errorKey = "emptyIp";
		} else if (!validateIp(trimmedIp)) {
			errorKey = "invalidIp";
		} else if (data.some((item) => item.ipAddress === trimmedIp)) {
			errorKey = "duplicateIp";
		}

		if (errorKey) {
			toast.add({
				type: "error",
				title: t($ => $.ipBlock.errors.title),
				description: t($ => $.ipBlock.errors[errorKey]),
			});
			return;
		}

		const now = new Date();
		const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

		const newItem: api.BlockedIpItem = {
			id: random.string(),
			ipAddress: trimmedIp,
			reason: newReason.trim() || "Manual block by administrator",
			type: "manual",
			blockedAt: formattedDate,
		};

		addItem(newItem);
		toast.add({
			type: "success",
			title: t($ => $.ipBlock.successes.title, {
				action: t($ => $.ipBlock.addBlock).toLowerCase(),
			}),
			description: t($ => $.ipBlock.successes.added, { ip: trimmedIp }),
		});

		setNewIp("");
		setNewReason("");
		setIsAddDialogOpen(false);
	};

	const handleBulkUnblock = () => {
		const count = selectedRows.length;
		if (count === 0) return;
		for (const item of selectedRows) {
			removeItem(item);
		}
		toast.add({
			type: "success",
			title: t($ => $.ipBlock.successes.title, {
				action: t($ => $.ipBlock.unblock).toLowerCase(),
			}),
			description: t($ => $.ipBlock.successes.removed, { count }),
		});
		setSelectedRows([]);
	};

	return (
		<DataTable
			heading={t($ => $.ipBlock.heading)}
			columns={ipBlockColumns}
			data={data}
			isLoading={isLoading}
			filterPlaceholder={t($ => $.ipBlock.searchPlaceholder)}
			onRowSelectionChange={(rows) => setSelectedRows(rows)}
			enableRowSelection
			enableSearch
			enablePagination
			enableRowNumber
		>
			<Button
				variant="destructive"
				size="icon-lg"
				disabled={selectedRows.length === 0}
				onClick={handleBulkUnblock}
				className="disabled:hidden"
			>
				<Trash2/>
				<span className="sr-only">{t($ => $.ipBlock.unblock)}</span>
			</Button>

			<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
				<DialogTrigger
					render={
						<Button size="lg">
							<Plus/>
							<span>{t($ => $.ipBlock.addBlockedIp)}</span>
						</Button>
					}
				/>

				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<ShieldAlert className="size-5 text-destructive"/>
							<span>{t($ => $.ipBlock.dialogTitle)}</span>
						</DialogTitle>
						<DialogDescription>
							{t($ => $.ipBlock.dialogDescription)}
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-4 py-2">
						<Field>
							<FieldLabel htmlFor="ip-address" className="gap-1.5">
								{t($ => $.ipBlock.columns.ipAddress)}
								<span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="ip-address"
								placeholder="e.g. 192.168.1.100"
								value={newIp}
								onChange={(e) => setNewIp(e.target.value)}
								className="font-mono"
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="block-reason" className="gap-1.5">
								{t($ => $.ipBlock.columns.reason)}
							</FieldLabel>
							<Input
								id="block-reason"
								placeholder={`e.g. ${t($ => $.ipBlock.defaultReason)}`}
								value={newReason}
								onChange={(e) => setNewReason(e.target.value)}
							/>
						</Field>
					</div>

					<DialogFooter className="gap-2">
						<DialogClose
							render={
								<Button type="button" variant="outline">
									{t($ => $.ipBlock.cancel)}
								</Button>
							}
						/>
						<Button type="button" onClick={handleAddIp}>
							{t($ => $.ipBlock.addBlock)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</DataTable>
	);
}
