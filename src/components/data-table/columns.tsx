import { createColumnHelper } from "@tanstack/react-table";
import {
	MoreHorizontal,
} from "lucide-react";

import type { TableDataItem } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SortButton } from "./sort-button";
import type { DataTableFeatures } from "./data-table-features";
import { RowDragHandle } from "./row-drag-handle";



const columnHelper = createColumnHelper<DataTableFeatures, TableDataItem>();



export const columns = columnHelper.columns([
	columnHelper.display({
		id: "drag",
		header: () => null,
		cell: () => <RowDragHandle/>,
		enableSorting: false,
		enableHiding: false,
	}),
	columnHelper.display({
		id: "select",
		meta: {
			className: "pr-2!",
		},
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				indeterminate={
					table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				className="overflow-hidden cursor-pointer"
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				className="overflow-hidden cursor-pointer"
				aria-label="Select row"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	}),
	columnHelper.accessor("id", {
		sortFn: "text",
		header: ({ column }) => {
			return (
				<SortButton
					sorted={column.getIsSorted() || null}
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					ID
				</SortButton>
			);
		},
	}),
	columnHelper.accessor("column1", {
		sortFn: "basic",
		header: ({ column }) => {
			return (
				<SortButton
					sorted={column.getIsSorted() || null}
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Column 1
				</SortButton>
			);
		},
		cell: ({ row }) => {
			const value = parseFloat(row.getValue("column1"));
			return <div className="text-center font-medium">{value.toLocaleString()}</div>;
		},
	}),
	columnHelper.accessor("column2", {
		sortFn: "text",
		header: ({ column }) => {
			return (
				<SortButton
					sorted={column.getIsSorted() || null}
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Column 2
				</SortButton>
			);
		},
	}),
	columnHelper.accessor("column3", {
		meta: {
			className: "w-full max-w-xs truncate",
		},
		header: "Column 3",
	}),
	columnHelper.accessor("column4", {
		sortFn: "basic",
		header: ({ column }) => {
			return (
				<SortButton
					sorted={column.getIsSorted() || null}
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Column 4
				</SortButton>
			);
		},
		cell: ({ row }) => {
			const value = parseFloat(row.getValue("column4"));
			return <div className="text-center font-medium">{value.toLocaleString()}</div>;
		},
	}),
	columnHelper.display({
		id: "actions",
		meta: {
			className: "text-right",
		},
		cell: ({ row: { original : row } }) => {
			return (
				<DropdownMenu>
					<DropdownMenuTrigger
						render={<Button variant="ghost" size="icon" className="h-8 w-8 p-0"/>}
					>
						<span className="sr-only">Open menu</span>
						<MoreHorizontal className="h-4 w-4"/>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-44">
						<DropdownMenuGroup>
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuItem
								onClick={() => navigator.clipboard.writeText(row.id)}
							>
								Copy ID
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator/>
						<DropdownMenuGroup>
							<DropdownMenuItem>View customer</DropdownMenuItem>
							<DropdownMenuItem>View details</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	}),
]);
