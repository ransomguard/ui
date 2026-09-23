import { useState } from "react";
import { Plus, ShieldAlert, Trash2 } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import * as api from "@/lib/api";
import * as random from "@/lib/random";

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



const columnHelper = createColumnHelper<DataTableFeatures, api.BlockedIpItem>();

const ipBlockColumns: ColumnDef<DataTableFeatures, api.BlockedIpItem>[] = columnHelper.columns([
	{
		accessorKey: "ipAddress",
		header: "IP Address",
		cell: ({ row }) => (
			<span className="font-mono font-medium">{row.original.ipAddress}</span>
		),
	},
	{
		accessorKey: "type",
		meta: {
			className: "text-center",
		},
		header: "Block Type",
		cell: ({ row }) => (
			<Badge
				variant={row.original.type === "manual" ? "secondary" : "destructive"}
			>
				{row.original.type === "manual" ? "Manual" : "Auto Detected"}
			</Badge>
		),
	},
	{
		accessorKey: "reason",
		meta: {
			className: "w-full max-w-xs truncate",
		},
		header: "Reason",
		cell: ({ row }) => (
			<span className="text-foreground/90">{row.original.reason}</span>
		),
	},
	{
		accessorKey: "blockedAt",
		meta: {
			className: "text-right",
		},
		header: "Blocked At",
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
	const [selectedRows, setSelectedRows] = useState<api.BlockedIpItem[]>([]);

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [newIp, setNewIp] = useState("");
	const [newReason, setNewReason] = useState("");
	const [ipError, setIpError] = useState("");

	const handleAddIp = () => {
		const trimmedIp = newIp.trim();
		if (!trimmedIp) {
			setIpError("Please enter an IP address.");
			return;
		}

		if (!validateIp(trimmedIp)) {
			setIpError("Invalid IPv4 address format (e.g. 192.168.1.100).");
			return;
		}

		if (data.some((item) => item.ipAddress === trimmedIp)) {
			setIpError("This IP address is already blocked.");
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
		setNewIp("");
		setNewReason("");
		setIpError("");
		setIsAddDialogOpen(false);
	};

	const handleBulkUnblock = () => {
		if (selectedRows.length === 0) return;
		for (const item of selectedRows) {
			removeItem(item);
		}
		setSelectedRows([]);
	};

	return (
		<DataTable
			heading="Blocked IP List"
			columns={ipBlockColumns}
			data={data}
			isLoading={isLoading}
			filterPlaceholder="Search IP address or reason..."
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
				<span className="sr-only">Unblock ({selectedRows.length})</span>
			</Button>

			<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
				<DialogTrigger
					render={
						<Button size="lg">
							<Plus/>
							<span>Add Blocked IP</span>
						</Button>
					}
				/>

				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<ShieldAlert className="size-5 text-destructive"/>
							<span>Manual IP Block</span>
						</DialogTitle>
						<DialogDescription>
							Enter the IP address and reason to manually block.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-4 py-2">
						<Field>
							<FieldLabel htmlFor="ip-address" className="gap-1.5">
								IP Address
								<span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="ip-address"
								placeholder="e.g. 192.168.1.100"
								value={newIp}
								onChange={(e) => {
									setNewIp(e.target.value);
									if (ipError) setIpError("");
								}}
								className="font-mono"
							/>
							{ipError && (
								<p className="text-xs text-destructive">{ipError}</p>
							)}
						</Field>

						<Field>
							<FieldLabel htmlFor="block-reason" className="gap-1.5">
								Reason
							</FieldLabel>
							<Input
								id="block-reason"
								placeholder="e.g. Manual block by administrator"
								value={newReason}
								onChange={(e) => setNewReason(e.target.value)}
							/>
						</Field>
					</div>

					<DialogFooter className="gap-2">
						<DialogClose
							render={
								<Button type="button" variant="outline">
									Cancel
								</Button>
							}
						/>
						<Button type="button" onClick={handleAddIp}>
							Add Block
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</DataTable>
	);
}
