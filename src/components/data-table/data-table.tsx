import { useState, type ReactNode } from "react";
import {
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import {
	useTable,
	type ColumnDef,
	type ColumnFiltersState,
	type ColumnVisibilityState,
	type RowSelectionState,
	type RowData,
	type SortingState,
} from "@tanstack/react-table";
import {
	SlidersHorizontal,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { features, type DataTableFeatures } from "./data-table-features";
import { RowDragHandleContext } from "./row-drag-context";



interface SortableTableRowProps {
	id: string;
	children: ReactNode;
	isSelected?: boolean;
}

function SortableTableRow({ id, children, isSelected }: SortableTableRowProps) {
	const {
		attributes,
		listeners,
		transform,
		transition,
		setNodeRef,
		isDragging,
	} = useSortable({ id });

	const style: React.CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	return (
		<RowDragHandleContext.Provider value={{ attributes, listeners }}>
			<TableRow
				ref={setNodeRef}
				style={style}
				data-state={isSelected && "selected"}
				data-dragging={isDragging}
				className={cn(
					"relative z-0 data-[dragging=true]:z-20 data-[dragging=true]:opacity-70 data-[dragging=true]:bg-muted/80",
					isDragging && "shadow-md",
				)}
			>
				{children}
			</TableRow>
		</RowDragHandleContext.Provider>
	);
}

interface DataTableProps<TData extends RowData & { id: string }> {
	columns: ColumnDef<DataTableFeatures, TData>[];
	data: TData[];
	onDataChange?: (data: TData[]) => void;
	filterPlaceholder?: string;
	filterColumnKey?: string;
	isLoading?: boolean;
	skeletonRowCount?: number;
	maxHeight?: string;
}

export function DataTable<TData extends RowData & { id: string }>({
	columns,
	data,
	onDataChange,
	filterPlaceholder = "Filter Column 2...",
	filterColumnKey = "column2",
	isLoading,
	skeletonRowCount = 5,
	maxHeight = "600px",
}: DataTableProps<TData>) {
	const [prevData, setPrevData] = useState<TData[]>(data);
	const [tableData, setTableData] = useState<TData[]>(data);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	if (prevData !== data) {
		setPrevData(data);
		setTableData(data);
	}


	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 4,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 150,
				tolerance: 5,
			},
		}),
		useSensor(KeyboardSensor),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (active && over && active.id !== over.id) {
			const oldIndex = tableData.findIndex((item) => item.id === active.id);
			const newIndex = tableData.findIndex((item) => item.id === over.id);
			if (oldIndex !== -1 && newIndex !== -1) {
				const next = arrayMove(tableData, oldIndex, newIndex);
				setTableData(next);
				onDataChange?.(next);
			}
		}
	};

	const table = useTable({
		features,
		data: tableData,
		columns,
		getRowId: (row) => row.id,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	return (
		<div className="space-y-4 min-w-0">
			{/* 상단 툴바: 필터 및 컬럼 토글 */}
			<div className="flex items-center justify-between gap-2">
				<Input
					placeholder={filterPlaceholder}
					value={(table.getColumn(filterColumnKey)?.getFilterValue() as string) ?? ""}
					onChange={(event) =>
						table.getColumn(filterColumnKey)?.setFilterValue(event.target.value)
					}
					className="max-w-sm"
				/>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={<Button variant="outline" size="sm" className="ml-auto"/>}
					>
						<SlidersHorizontal className="mr-2 h-4 w-4"/>
						Columns
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{table
							.getAllColumns()
							.filter((column) => column.getCanHide())
							.map((column) => {
								return (
									<DropdownMenuCheckboxItem
										key={column.id}
										className="capitalize"
										checked={column.getIsVisible()}
										onCheckedChange={(value) =>
											column.toggleVisibility(!!value)
										}
									>
										{column.id}
									</DropdownMenuCheckboxItem>
								);
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* 테이블 뷰 (드래그 정렬 지원) */}
			<div
				className={cn(
					"overflow-hidden rounded-md border border-border bg-card",
					"**:data-[slot=table-container]:overflow-auto",
					"**:data-[slot=table-container]:max-h-(--table-max-height)",
				)}
				style={{
					"--table-max-height": maxHeight,
				} as React.CSSProperties}
			>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					modifiers={[restrictToVerticalAxis]}
					onDragEnd={handleDragEnd}
				>
					<Table>
						<TableHeader className="sticky top-0 z-30 bg-card">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead
												key={header.id}
												className={header.column.columnDef.meta?.className}
											>
												{header.isPlaceholder ? null : (
													<table.FlexRender header={header}/>
												)}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{isLoading ? (
								Array.from({ length: skeletonRowCount }).map((_, index) => (
									<TableRow key={`skeleton-row-${index}`}>
										{columns.map((col, colIndex) => (
											<TableCell
												key={`skeleton-cell-${colIndex}`}
												className={col.meta?.className}
											>
												<Skeleton className="h-8 w-full"/>
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<SortableContext
									items={table.getRowModel().rows.map((row) => row.id)}
									strategy={verticalListSortingStrategy}
								>
									{table.getRowModel().rows?.length ? (
										table.getRowModel().rows.map((row) => (
											<SortableTableRow
												key={row.id}
												id={row.id}
												isSelected={row.getIsSelected()}
											>
												{row.getVisibleCells().map((cell) => (
													<TableCell
														key={cell.id}
														className={cell.column.columnDef.meta?.className}
													>
														<table.FlexRender cell={cell}/>
													</TableCell>
												))}
											</SortableTableRow>
										))
									) : (
										<TableRow>
											<TableCell colSpan={columns.length} className="h-24 text-center">
												No results.
											</TableCell>
										</TableRow>
									)}
								</SortableContext>
							)}
						</TableBody>
					</Table>
				</DndContext>
			</div>

			{/* 하단 페이지네이션 */}
			<div className="flex items-center justify-between px-4">
				<div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
					{isLoading ? 0 : table.getSelectedRowModel().rows.length} of {isLoading ? 0 : table.getPaginatedRowModel().rows.length} row(s) selected.
				</div>
				<div className="flex w-full items-center gap-8 lg:w-fit">
					<div className="hidden items-center gap-2 lg:flex">
						<p className="text-sm font-medium">Rows per page</p>
						<Select
							value={table.state.pagination?.pageSize ?? 10}
							onValueChange={(value) => {
								if (value !== null) {
									table.setPageSize(value);
								}
							}}
							disabled={isLoading}
						>
							<SelectTrigger className="h-8 w-18">
								<SelectValue placeholder={table.state.pagination?.pageSize ?? 10}/>
							</SelectTrigger>
							<SelectContent side="top">
								<SelectGroup>
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={pageSize}>
											{pageSize}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<div className="flex w-fit items-center justify-center text-sm font-medium">
						Page {isLoading ? 0 : table.getPageCount() > 0 ? (table.state.pagination?.pageIndex ?? 0) + 1 : 0} of {isLoading ? 0 : table.getPageCount()}
					</div>
					<div className="ml-auto flex items-center gap-2 lg:ml-0">
						<Button
							variant="outline"
							size="icon"
							onClick={() => table.firstPage()}
							disabled={isLoading || !table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to first page</span>
							<ChevronsLeft/>
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => table.previousPage()}
							disabled={isLoading || !table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to previous page</span>
							<ChevronLeft/>
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => table.nextPage()}
							disabled={isLoading || !table.getCanNextPage()}
						>
							<span className="sr-only">Go to next page</span>
							<ChevronRight/>
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => table.lastPage()}
							disabled={isLoading || !table.getCanNextPage()}
						>
							<span className="sr-only">Go to last page</span>
							<ChevronsRight/>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
