import { useState, useMemo, useEffect } from "react";
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
	type PaginationState,
} from "@tanstack/react-table";
import {
	SlidersHorizontal,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Search,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
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
import { RowDragHandle } from "./row-drag-handle";



interface SortableTableRowProps {
	id: string;
	children: React.ReactNode;
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
				data-state={isSelected ? "selected" : undefined}
				data-dragging={isDragging}
				className={cn(
					"h-12 relative z-0 data-[dragging=true]:z-20 data-[dragging=true]:bg-muted/80",
					isDragging && "shadow-md",
				)}
			>
				{children}
			</TableRow>
		</RowDragHandleContext.Provider>
	);
}



export interface DataTableProps<TData extends RowData & { id: string }> {
	heading?: React.ReactNode;
	description?: React.ReactNode;

	columns: ColumnDef<DataTableFeatures, TData>[];
	data: TData[];
	onDataChange?: (data: TData[]) => void;

	enableRowDrag?: boolean;
	enableRowSelection?: boolean;
	enableRowNumber?: boolean;
	enableColumnVisibility?: boolean;
	columnVisibilityOptions?: string[];
	enableSearch?: boolean;

	enablePagination?: boolean;
	defaultPageSize?: number;
	pageSizeOptions?: number[];

	filterPlaceholder?: string;
	filterColumnKey?: string;

	maxHeight?: string;
	isLoading?: boolean;
	skeletonRowCount?: number;

	onRowSelectionChange?: (selectedRows: TData[], selectedRowIds: RowSelectionState) => void;

	children?: React.ReactNode;
}

export function DataTable<TData extends RowData & { id: string }>({
	heading,
	description,
	columns,
	data,
	onDataChange,
	enableRowDrag,
	enableRowSelection,
	enableRowNumber,
	enableColumnVisibility,
	columnVisibilityOptions,
	enableSearch,
	enablePagination,
	defaultPageSize = 10,
	pageSizeOptions = [5, 10, 20, 30, 50],
	filterPlaceholder = "Filter...",
	filterColumnKey,
	maxHeight = "600px",
	isLoading,
	skeletonRowCount = 5,
	onRowSelectionChange,
	children,
}: DataTableProps<TData>) {
	const [prevData, setPrevData] = useState<TData[]>(data);
	const [tableData, setTableData] = useState<TData[]>(data);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [globalFilter, setGlobalFilter] = useState("");
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: defaultPageSize,
	});

	if (prevData !== data) {
		setPrevData(data);
		setTableData(data);
	}

	const resolvedColumns = useMemo(() => {
		let cols = [...columns];

		// enableRowDrag 플래그 제어: false면 drag 컬럼 제거, true인데 없으면 추가
		if (!enableRowDrag) {
			cols = cols.filter((c) => c.id !== "drag");
		} else if (!cols.some((c) => c.id === "drag")) {
			const dragCol: ColumnDef<DataTableFeatures, TData> = {
				id: "drag",
				header: () => null,
				cell: () => <RowDragHandle/>,
				enableSorting: false,
				enableHiding: false,
			};
			cols = [dragCol, ...cols];
		}

		// enableRowSelection 플래그 제어: false면 select 컬럼 제거, true인데 없으면 추가
		if (!enableRowSelection) {
			cols = cols.filter((c) => c.id !== "select");
		} else if (!cols.some((c) => c.id === "select")) {
			const selectionCol: ColumnDef<DataTableFeatures, TData> = {
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={table.getIsAllPageRowsSelected()}
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
						aria-label="Select all"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						aria-label="Select row"
					/>
				),
				meta: {
					className: "w-12 px-3 text-center",
				},
				enableSorting: false,
				enableHiding: false,
			};

			const dragIndex = cols.findIndex((c) => c.id === "drag");
			if (dragIndex !== -1) {
				cols.splice(dragIndex + 1, 0, selectionCol);
			} else {
				cols = [selectionCol, ...cols];
			}
		}

		// enableRowNumber 플래그 제어: false면 rowNumber 컬럼 제거, true인데 없으면 추가
		if (!enableRowNumber) {
			cols = cols.filter((c) => c.id !== "rowNumber");
		} else if (!cols.some((c) => c.id === "rowNumber")) {
			const rowNumberCol: ColumnDef<DataTableFeatures, TData> = {
				id: "rowNumber",
				header: () => "#",
				cell: ({ row }) => (
					<div className="text-xs text-muted-foreground tabular-nums">
						{row.index + 1}
					</div>
				),
				meta: {
					className: "w-12 px-2 text-center",
				},
				enableSorting: false,
				enableHiding: false,
			};

			let insertIndex = 0;
			const selectIndex = cols.findIndex((c) => c.id === "select");
			const dragIndex = cols.findIndex((c) => c.id === "drag");
			if (selectIndex !== -1) {
				insertIndex = selectIndex + 1;
			} else if (dragIndex !== -1) {
				insertIndex = dragIndex + 1;
			}
			cols.splice(insertIndex, 0, rowNumberCol);
		}

		return cols;
	}, [columns, enableRowDrag, enableRowSelection, enableRowNumber]);

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
		columns: resolvedColumns,
		getRowId: (row) => row.id,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onPaginationChange: setPagination,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			...(enablePagination ? { pagination } : {}),
		},
	});

	useEffect(() => {
		if (onRowSelectionChange) {
			const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
			onRowSelectionChange(selectedRows, rowSelection);
		}
	}, [rowSelection, table, onRowSelectionChange]);

	// 검색 값 얻기 및 설정
	const searchValue = filterColumnKey
		? ((table.getColumn(filterColumnKey)?.getFilterValue() as string) ?? "")
		: globalFilter;

	const handleSearchChange = (val: string) => {
		if (filterColumnKey) {
			table.getColumn(filterColumnKey)?.setFilterValue(val);
		} else {
			setGlobalFilter(val);
			// 단순 전역 텍스트 필터 처리
			if (table.getColumn("column2")) {
				table.getColumn("column2")?.setFilterValue(val);
			}
		}
	};

	return (
		<div className="space-y-4 min-w-0">
			{/* 상단 통합 헤더/툴바 */}
			{(heading || description || enableSearch || enableColumnVisibility || children) && (
				<div className="flex items-end-safe justify-between gap-2">
					{/* 좌측에 위치한 타이틀 & 설명 & 검색 */}
					{(heading || description || enableSearch) && (
						<div className="space-y-3">
							{heading && (
								typeof heading === "string" ? (
									<h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
								) : (
									heading
								)
							)}
							{description && (
								typeof description === "string" ? (
									<p className="text-xs text-muted-foreground">{description}</p>
								) : (
									description
								)
							)}
							{enableSearch && (
								<InputGroup>
									<InputGroupInput
										type="text"
										placeholder={filterPlaceholder}
										value={searchValue}
										onChange={(e) => handleSearchChange(e.target.value)}
									/>
									<InputGroupAddon>
										<Search/>
									</InputGroupAddon>
								</InputGroup>
							)}
						</div>
					)}

					{/* 우측 툴바 (Children & Columns) */}
					{(enableColumnVisibility || children) && (
						<div className="flex items-center-safe gap-2 shrink-0">
							{children}

							{enableColumnVisibility && (
								<DropdownMenu>
									<DropdownMenuTrigger
										render={<Button size="lg"/>}
									>
										<SlidersHorizontal/>
										Columns
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										{table
											.getAllColumns()
											.filter((column) => {
												if (!column.getCanHide()) return false;
												if (columnVisibilityOptions?.length) {
													return columnVisibilityOptions.includes(column.id);
												}
												return true;
											})
											.map((column) => (
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
											))}
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>
					)}
				</div>
			)}

			{/* 테이블 뷰 (드래그 정렬 지원) */}
			<div
				className={cn(
					"overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs",
					"**:data-[slot=table-container]:overflow-auto",
					"**:data-[slot=table-container]:max-h-(--table-max-height)",
				)}
				style={{
					"--table-max-height": maxHeight,
				} as React.CSSProperties}
			>
				{enableRowDrag ? (
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
										{headerGroup.headers.map((header) => (
											<TableHead
												key={header.id}
												className={header.column.columnDef.meta?.className}
											>
												{header.isPlaceholder ? null : (
													<table.FlexRender header={header}/>
												)}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{isLoading ? (
									Array.from({ length: skeletonRowCount }).map((_, index) => (
										<TableRow key={`skeleton-row-${index}`} className="h-12">
											{resolvedColumns.map((col, colIndex) => (
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
												<TableCell colSpan={resolvedColumns.length} className="h-24 text-center text-muted-foreground">
													No results.
												</TableCell>
											</TableRow>
										)}
									</SortableContext>
								)}
							</TableBody>
						</Table>
					</DndContext>
				) : (
					<Table>
						<TableHeader className="sticky top-0 z-30 bg-card">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead
											key={header.id}
											className={header.column.columnDef.meta?.className}
										>
											{header.isPlaceholder ? null : (
												<table.FlexRender header={header}/>
											)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{isLoading ? (
								Array.from({ length: skeletonRowCount }).map((_, index) => (
									<TableRow key={`skeleton-row-${index}`} className="h-12">
										{resolvedColumns.map((col, colIndex) => (
											<TableCell
												key={`skeleton-cell-${colIndex}`}
												className={col.meta?.className}
											>
												<Skeleton className="h-8 w-full"/>
											</TableCell>
										))}
									</TableRow>
								))
							) : table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() ? "selected" : undefined}
										className="h-12"
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className={cell.column.columnDef.meta?.className}
											>
												<table.FlexRender cell={cell}/>
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={resolvedColumns.length} className="h-24 text-center text-muted-foreground">
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				)}
			</div>

			{/* 하단 페이지네이션 */}
			{enablePagination && (
				<div className="flex items-center justify-between px-4">
					<div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
						{isLoading ? 0 : table.getSelectedRowModel().rows.length} of {isLoading ? 0 : table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<p className="text-sm font-medium">Rows per page</p>
							<Select
								value={table.state.pagination?.pageSize ?? defaultPageSize}
								onValueChange={(value) => {
									if (value !== null) {
										table.setPageSize(Number(value));
									}
								}}
								disabled={isLoading}
							>
								<SelectTrigger className="w-18">
									<SelectValue placeholder={table.state.pagination?.pageSize ?? defaultPageSize}/>
								</SelectTrigger>
								<SelectContent side="top">
									<SelectGroup>
										{pageSizeOptions.map((pageSize) => (
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
			)}
		</div>
	);
}
