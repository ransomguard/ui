import { useState, useEffect } from "react";
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



export interface IpBlockSectionProps {
	data?: api.BlockedIpItem[];
	isLoading?: boolean;
}

export default function IpBlockSection({
	data: initialData,
	isLoading: externalLoading,
}: IpBlockSectionProps) {
	const [items, setItems] = useState<api.BlockedIpItem[]>(initialData ?? []);
	const [isLoading, setIsLoading] = useState(externalLoading ?? !initialData);
	const [selectedRows, setSelectedRows] = useState<api.BlockedIpItem[]>([]);

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [newIp, setNewIp] = useState("");
	const [newReason, setNewReason] = useState("");
	const [ipError, setIpError] = useState("");

	useEffect(() => {
		if (initialData) return;

		let isMounted = true;
		api.getBlockedIpData().then((res) => {
			if (isMounted) {
				setItems(res);
				setIsLoading(false);
			}
		});

		return () => {
			isMounted = false;
		};
	}, [initialData]);

	const validateIp = (ip: string) => {
		const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.){3}(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)$/;
		return ipv4Regex.test(ip.trim());
	};

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

		if (items.some((item) => item.ipAddress === trimmedIp)) {
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

		setItems((prev) => [newItem, ...prev]);
		setNewIp("");
		setNewReason("");
		setIpError("");
		setIsAddDialogOpen(false);
	};

	const handleBulkUnblock = () => {
		if (selectedRows.length === 0) return;
		const idsToRemove = new Set(selectedRows.map((r) => r.id));
		setItems((prev) => prev.filter((item) => !idsToRemove.has(item.id)));
		setSelectedRows([]);
	};

	return (
		<DataTable
			heading="Blocked IP List"
			description="Manage detected or manually added blocked IP addresses and unblock selected IPs."
			columns={ipBlockColumns}
			data={items}
			isLoading={isLoading}
			enableRowSelection={true}
			enableRowDrag={false}
			enableColumnVisibility={false}
			enableSearch={true}
			enablePagination={true}
			enableRowNumber
			filterPlaceholder="Search IP address or reason..."
			onRowSelectionChange={(rows) => setSelectedRows(rows)}
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
						<div className="flex flex-col gap-1.5">
							<label htmlFor="ip-address" className="text-xs">
								IP Address <span className="text-destructive">*</span>
							</label>
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
						</div>

						<div className="grid gap-1.5">
							<label htmlFor="block-reason" className="text-xs">
								Reason
							</label>
							<Input
								id="block-reason"
								placeholder="e.g. Manual block by administrator"
								value={newReason}
								onChange={(e) => setNewReason(e.target.value)}
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<DialogClose
							render={
								<Button type="button" variant="outline" size="sm">
									Cancel
								</Button>
							}
						/>
						<Button type="button" size="sm" onClick={handleAddIp}>
							Add Block
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</DataTable>
	);
}
