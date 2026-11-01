import { useId, useState, useEffect, useLayoutEffect, useRef } from "react";
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
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Field,
	FieldLabel,
} from "@/components/ui/field";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { features, type DataTableFeatures } from "./data-table-features";
import { RowDragHandleContext } from "./row-drag-context";
import { RowDragHandle } from "./row-drag-handle";



interface SortableTableRowProps {
	id: string;
	children: React.ReactNode;
	isSelected?: boolean;
	isHighlighted?: boolean;
}

function SortableTableRow({ id, children, isSelected, isHighlighted }: SortableTableRowProps) {
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
				data-row-id={id}
				data-highlighted={isHighlighted ? "true" : undefined}
				data-dragging={isDragging}
				className={cn(
					"h-12 relative z-0 transition-colors duration-500 data-[dragging=true]:z-20 data-[dragging=true]:bg-muted/80",
					isHighlighted && "bg-primary/20 ring-2 ring-primary ring-inset z-10",
					isDragging && "shadow-md",
				)}
			>
				{children}
			</TableRow>
		</RowDragHandleContext.Provider>
	);
}



function findRowElement(rowId: string): HTMLElement | null {
	if (typeof window !== "undefined" && typeof window.CSS?.escape === "function") {
		try {
			return document.querySelector(`[data-row-id="${window.CSS.escape(rowId)}"]`) as HTMLElement | null;
		} catch {
			// CSS.escape 실패 시 속성 순회 fallback
		}
	}
	const rows = document.querySelectorAll<HTMLElement>("[data-row-id]");
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		if (row && row.getAttribute("data-row-id") === rowId) {
			return row;
		}
	}
	return null;
}



export interface DataTableProps<TData extends RowData & { id: string }> extends React.ComponentProps<"div"> {
	heading?: React.ReactNode;

	columns: ColumnDef<DataTableFeatures, TData>[];
	data: TData[];
	onDataChange?: (data: TData[]) => void;

	enableRowDrag?: boolean;
	enableRowSelection?: boolean;
	enableRowNumber?: boolean;
	rowNumberOffset?: number;
	enableColumnVisibility?: boolean;
	columnVisibilityOptions?: string[];
	enableSearch?: boolean;

	enablePagination?: boolean;
	defaultPageSize?: number;
	pageSizeOptions?: number[];

	hasMore?: boolean;
	hasMoreBottom?: boolean;
	hasMoreTop?: boolean;
	isLoadingMore?: boolean;
	isLoadingMoreBottom?: boolean;
	isLoadingMoreTop?: boolean;
	onLoadMore?: () => void;
	onLoadMoreBottom?: () => void;
	onLoadMoreTop?: () => void;

	highlightedRowId?: string | null;
	onHighlightEnd?: () => void;

	filterPlaceholder?: string;
	filterColumnKey?: string;

	maxHeight?: string;
	isLoading?: boolean;
	skeletonRowCount?: number;

	onRowSelectionChange?: (selectedRows: TData[], selectedRowIds: RowSelectionState) => void;
	onRowClick?: (row: TData) => void;
}

export function DataTable<TData extends RowData & { id: string }>({
	heading,
	columns,
	data,
	onDataChange,
	enableRowDrag,
	enableRowSelection,
	enableRowNumber,
	rowNumberOffset = 0,
	enableColumnVisibility,
	columnVisibilityOptions,
	enableSearch,
	enablePagination,
	defaultPageSize = 10,
	pageSizeOptions = [5, 10, 20, 30, 50],
	hasMore,
	hasMoreBottom,
	hasMoreTop,
	isLoadingMore,
	isLoadingMoreBottom,
	isLoadingMoreTop,
	onLoadMore,
	onLoadMoreBottom,
	onLoadMoreTop,
	highlightedRowId,
	onHighlightEnd,
	filterPlaceholder,
	filterColumnKey,
	maxHeight = "600px",
	isLoading,
	skeletonRowCount = 5,
	onRowSelectionChange,
	onRowClick,
	id: _id,
	className,
	children,
	...props
}: DataTableProps<TData>) {
	const { t } = useTranslation();

	const localId = useId();
	const id = _id ?? `data-table-${localId}`;
	const searchId = `${id}-search`;

	const topSentinelRef = useRef<HTMLTableRowElement | null>(null);
	const bottomSentinelRef = useRef<HTMLTableRowElement | null>(null);
	const prevScrollHeightRef = useRef<number>(0);
	const isPrependingRef = useRef<boolean>(false);
	const hasScrolledHighlightRef = useRef<string | null>(null);
	const highlightAnchorTopRef = useRef<number | null>(null);
	const isAdjustingScrollRef = useRef<boolean>(false);

	const [prevHighlightedProp, setPrevHighlightedProp] = useState<string | null | undefined>(highlightedRowId);
	const [activeHighlightId, setActiveHighlightId] = useState<string | null>(highlightedRowId ?? null);

	if (prevHighlightedProp !== highlightedRowId) {
		setPrevHighlightedProp(highlightedRowId);
		setActiveHighlightId(highlightedRowId ?? null);
	}
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

	// 1. 기존 컬럼에서 특수 컬럼(drag, select, rowNumber)이 이미 섞여 있다면 안전하게 제거
	const baseColumns = columns.filter(
		(c) => c.id !== "drag" && c.id !== "select" && c.id !== "rowNumber"
	);

	// 2. 조건에 맞는 시스템 컬럼들을 순서대로 담을 배열 생성
	const systemColumns: ColumnDef<DataTableFeatures, TData>[] = [];
	if (enableRowDrag) {
		systemColumns.push({
			id: "drag",
			header: () => null,
			cell: () => <RowDragHandle/>,
			enableSorting: false,
			enableHiding: false,
		});
	}
	if (enableRowSelection) {
		systemColumns.push({
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
		});
	}
	if (enableRowNumber) {
		systemColumns.push({
			id: "rowNumber",
			header: () => "#",
			cell: ({ row, table }) => {
				const idx = enablePagination
					? row.index
					: table.getSortedRowModel().rows.findIndex((r) => r.id === row.id);
				const actualIdx = idx !== -1 ? idx : row.index;
				return (
					<div className="text-xs text-muted-foreground tabular-nums">
						{actualIdx + 1 + rowNumberOffset}
					</div>
				);
			},
			meta: {
				className: "w-12 px-2 text-center",
			},
			enableSorting: false,
			enableHiding: false,
		});
	}

	// 3. 시스템 컬럼 뒤에 기본 컬럼을 붙여서 최종 배열 완성 (React Compiler가 알아서 캐싱)
	const resolvedColumns = [...systemColumns, ...baseColumns];

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

	const displayedRows = enablePagination
		? table.getRowModel().rows
		: table.getSortedRowModel().rows;

	const effectiveHasMoreBottom = hasMoreBottom ?? hasMore;
	const effectiveIsLoadingMoreBottom = isLoadingMoreBottom ?? isLoadingMore;
	const effectiveOnLoadMoreBottom = onLoadMoreBottom ?? onLoadMore;

	const canShowMoreTop = !enablePagination && Boolean(hasMoreTop);
	const canShowMoreBottom = !enablePagination && Boolean(effectiveHasMoreBottom);

	// 상단 센티넬 관찰자 (위쪽 무한스크롤)
	useEffect(() => {
		if (enablePagination || isLoading) return;
		const el = topSentinelRef.current;
		if (!el || !canShowMoreTop) return;

		const scrollParent = (
			el.closest("[data-slot=\"scroll-area-viewport\"]") ??
			el.closest("[data-slot=\"table-container\"]")
		) as HTMLElement | null;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry?.isIntersecting) return;

				if (hasMoreTop && !isLoadingMoreTop) {
					if (scrollParent) {
						prevScrollHeightRef.current = scrollParent.scrollHeight;
						isPrependingRef.current = true;
					}
					onLoadMoreTop?.();
				}
			},
			{
				root: scrollParent,
				rootMargin: "80px",
			},
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [
		enablePagination,
		isLoading,
		canShowMoreTop,
		displayedRows.length,
		hasMoreTop,
		isLoadingMoreTop,
		onLoadMoreTop,
	]);

	// 상단에 데이터 추가 시 스크롤 위치 점프 보정
	useLayoutEffect(() => {
		if (!isPrependingRef.current) return;
		const el = topSentinelRef.current;
		const scrollParent = (
			el?.closest("[data-slot=\"scroll-area-viewport\"]") ??
			el?.closest("[data-slot=\"table-container\"]")
		) as HTMLElement | null;

		if (scrollParent && prevScrollHeightRef.current > 0) {
			const delta = scrollParent.scrollHeight - prevScrollHeightRef.current;
			if (delta > 0) {
				scrollParent.scrollTop += delta;
			}
		}
		isPrependingRef.current = false;
	}, [tableData]);

	// 하단 센티넬 관찰자 (아래쪽 무한스크롤)
	useEffect(() => {
		if (enablePagination || isLoading) return;
		const el = bottomSentinelRef.current;
		if (!el || !canShowMoreBottom) return;

		const scrollParent = (
			el.closest("[data-slot=\"scroll-area-viewport\"]") ??
			el.closest("[data-slot=\"table-container\"]")
		) as Element | null;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry?.isIntersecting) return;

				if (effectiveHasMoreBottom && !effectiveIsLoadingMoreBottom) {
					effectiveOnLoadMoreBottom?.();
				}
			},
			{
				root: scrollParent,
				rootMargin: "80px",
			},
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [
		enablePagination,
		isLoading,
		canShowMoreBottom,
		displayedRows.length,
		effectiveHasMoreBottom,
		effectiveIsLoadingMoreBottom,
		effectiveOnLoadMoreBottom,
	]);

	const onHighlightEndRef = useRef(onHighlightEnd);
	useEffect(() => {
		onHighlightEndRef.current = onHighlightEnd;
	});

	// 사용자가 마우스 휠을 아래로 굴릴 때 바닥에 닿아 있거나 스크롤바가 없는 경우 추가 로드
	const handleWheel = (e: React.WheelEvent) => {
		if (e.deltaY > 0 && canShowMoreBottom && !effectiveIsLoadingMoreBottom) {
			const scrollParent = (
				bottomSentinelRef.current?.closest("[data-slot=\"scroll-area-viewport\"]") ??
				bottomSentinelRef.current?.closest("[data-slot=\"table-container\"]")
			) as HTMLElement | null;
			if (scrollParent && scrollParent.scrollTop + scrollParent.clientHeight >= scrollParent.scrollHeight - 20) {
				effectiveOnLoadMoreBottom?.();
			}
		}
	};

	// 하이라이트 행 활성화 시 2.2초 타이머 (화면 행 리렌더링과 독립적으로 1회만 동작)
	useEffect(() => {
		if (!activeHighlightId) return;

		const timer = setTimeout(() => {
			setActiveHighlightId(null);
			onHighlightEndRef.current?.();
		}, 2200);

		return () => clearTimeout(timer);
	}, [activeHighlightId]);

	// 하이라이트 행 자동 스크롤 및 무한스크롤 시 뷰포트 내 상대 위치 고정(Scroll Anchoring)
	useLayoutEffect(() => {
		if (!activeHighlightId) {
			hasScrolledHighlightRef.current = null;
			highlightAnchorTopRef.current = null;
			return;
		}

		const rowEl = findRowElement(activeHighlightId);
		if (!rowEl) return;

		const scrollParent = (
			rowEl.closest("[data-slot=\"scroll-area-viewport\"]") ??
			rowEl.closest("[data-slot=\"table-container\"]")
		) as HTMLElement | null;
		if (!scrollParent) return;

		// 최초 1회: 화면 중앙으로 스크롤 이동 및 앵커 좌표 기록
		if (hasScrolledHighlightRef.current !== activeHighlightId) {
			rowEl.scrollIntoView({ behavior: "auto", block: "center" });
			hasScrolledHighlightRef.current = activeHighlightId;
			highlightAnchorTopRef.current = rowEl.getBoundingClientRect().top;
			return;
		}

		// 무한스크롤 등으로 데이터가 위나 아래에 추가되어 행 위치가 밀려난 경우 보정
		if (highlightAnchorTopRef.current !== null) {
			const currentTop = rowEl.getBoundingClientRect().top;
			const delta = currentTop - highlightAnchorTopRef.current;
			if (Math.abs(delta) > 0.5) {
				isAdjustingScrollRef.current = true;
				scrollParent.scrollTop += delta;
				requestAnimationFrame(() => {
					isAdjustingScrollRef.current = false;
				});
			}
		} else {
			highlightAnchorTopRef.current = rowEl.getBoundingClientRect().top;
		}
	}, [activeHighlightId, tableData]);

	// 하이라이트 활성 상태에서 사용자가 직접 스크롤할 경우 기준 앵커 좌표 갱신
	useEffect(() => {
		if (!activeHighlightId) return;

		const rowEl = findRowElement(activeHighlightId);
		const scrollParent = (
			rowEl?.closest("[data-slot=\"scroll-area-viewport\"]") ??
			rowEl?.closest("[data-slot=\"table-container\"]") ??
			bottomSentinelRef.current?.closest("[data-slot=\"scroll-area-viewport\"]")
		) as HTMLElement | null;
		if (!scrollParent) return;

		const handleScroll = () => {
			if (isAdjustingScrollRef.current) return;
			const targetRow = findRowElement(activeHighlightId);
			if (targetRow) {
				highlightAnchorTopRef.current = targetRow.getBoundingClientRect().top;
			}
		};

		scrollParent.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			scrollParent.removeEventListener("scroll", handleScroll);
		};
	}, [activeHighlightId]);

	return (
		<div
			id={id}
			className={cn(
				"space-y-4 min-w-0",
				className,
			)}
			{...props}
		>
			{/* 상단 통합 헤더/툴바 */}
			{(heading || enableSearch || enableColumnVisibility || children) && (
				<div className="flex items-end-safe justify-between gap-2">
					{/* 좌측에 위치한 타이틀 & 검색 */}
					{(heading || enableSearch) && (
						<Field className="max-w-lg w-full">
							<FieldLabel className="text-lg tracking-tight" htmlFor={searchId}>{heading}</FieldLabel>
							{enableSearch && (
								<InputGroup>
									<InputGroupInput
										id={searchId}
										type="text"
										placeholder={filterPlaceholder ?? t($ => $.table.filterPlaceholder)}
										value={searchValue}
										onChange={(e) => handleSearchChange(e.target.value)}
									/>
									<InputGroupAddon>
										<Search/>
									</InputGroupAddon>
								</InputGroup>
							)}
						</Field>
					)}

					{/* 우측 툴바 (Children & Columns) */}
					{(enableColumnVisibility || children) && (
						<div className="flex items-center-safe gap-2 shrink-0">
							{children}

							{enableColumnVisibility && (
								<DropdownMenu>
									<DropdownMenuTrigger
										render={<Button size="icon-lg" variant="secondary"/>}
									>
										<SlidersHorizontal/>
										<span className="sr-only">{t($ => $.table.columns)}</span>
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
			<ScrollArea
				onWheel={handleWheel}
				className={cn(
					"overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs",
					"**:data-[slot=table-container]:overflow-visible",
					"**:data-[slot=scroll-area-viewport]:max-h-(--table-max-height)",
					"**:data-[slot=table-head]:last:pr-4 **:data-[slot=table-cell]:last:pr-4",
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
										items={displayedRows.map((row) => row.id)}
										strategy={verticalListSortingStrategy}
									>
										{displayedRows.length ? (
											<>
												{canShowMoreTop && (
													<TableRow ref={topSentinelRef} className="h-10">
														<TableCell colSpan={resolvedColumns.length} className="py-2 text-center">
															{isLoadingMoreTop ? (
																<Skeleton className="h-6 w-32 mx-auto"/>
															) : (
																<div className="h-4 w-full"/>
															)}
														</TableCell>
													</TableRow>
												)}
												{displayedRows.map((row) => (
													<SortableTableRow
														key={row.id}
														id={row.id}
														isSelected={row.getIsSelected()}
														isHighlighted={row.id === activeHighlightId}
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
												))}
												{canShowMoreBottom && (
													<TableRow ref={bottomSentinelRef} className="h-12">
														<TableCell colSpan={resolvedColumns.length} className="py-2 text-center">
															{effectiveIsLoadingMoreBottom ? (
																<Skeleton className="h-6 w-32 mx-auto"/>
															) : (
																<div className="h-4 w-full"/>
															)}
														</TableCell>
													</TableRow>
												)}
											</>
										) : (
											<TableRow>
												<TableCell colSpan={resolvedColumns.length} className="h-24 text-center text-muted-foreground">
													{t($ => $.table.noResults)}
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
							) : displayedRows.length ? (
								<>
									{canShowMoreTop && (
										<TableRow ref={topSentinelRef} className="h-10">
											<TableCell colSpan={resolvedColumns.length} className="py-2 text-center">
												{isLoadingMoreTop ? (
													<Skeleton className="h-6 w-32 mx-auto"/>
												) : (
													<div className="h-4 w-full"/>
												)}
											</TableCell>
										</TableRow>
									)}
									{displayedRows.map((row) => (
										<TableRow
											key={row.id}
											data-state={row.getIsSelected() ? "selected" : undefined}
											data-row-id={row.id}
											data-highlighted={row.id === activeHighlightId ? "true" : undefined}
											onClick={() => onRowClick?.(row.original)}
											className={cn(
												"h-12 transition-colors duration-500",
												row.id === activeHighlightId && "bg-primary/20 ring-2 ring-primary ring-inset z-10",
												onRowClick && "cursor-pointer hover:bg-muted/60",
											)}
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
									))}
									{canShowMoreBottom && (
										<TableRow ref={bottomSentinelRef} className="h-12">
											<TableCell colSpan={resolvedColumns.length} className="py-2 text-center">
												{effectiveIsLoadingMoreBottom ? (
													<Skeleton className="h-6 w-32 mx-auto"/>
												) : (
													<div className="h-4 w-full"/>
												)}
											</TableCell>
										</TableRow>
									)}
								</>
							) : (
								<TableRow>
									<TableCell colSpan={resolvedColumns.length} className="h-24 text-center text-muted-foreground">
										{t($ => $.table.noResults)}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				)}
				<ScrollBar orientation="horizontal"/>
			</ScrollArea>

			{/* 하단 페이지네이션 */}
			{enablePagination && (
				<div className="flex items-center justify-between px-4">
					<div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
						{t($ => $.table.selectedRows, {
							selected: isLoading ? 0 : table.getSelectedRowModel().rows.length,
							total: isLoading ? 0 : table.getFilteredRowModel().rows.length,
						})}
					</div>
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<p className="text-sm font-medium">{t($ => $.table.rowsPerPage)}</p>
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
							{t($ => $.table.pageOf, {
								page: isLoading ? 0 : table.getPageCount() > 0 ? (table.state.pagination?.pageIndex ?? 0) + 1 : 0,
								total: isLoading ? 0 : table.getPageCount(),
							})}
						</div>
						<div className="ml-auto flex items-center gap-2 lg:ml-0">
							<Button
								variant="outline"
								size="icon"
								onClick={() => table.firstPage()}
								disabled={isLoading || !table.getCanPreviousPage()}
							>
								<span className="sr-only">{t($ => $.table.firstPage)}</span>
								<ChevronsLeft/>
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={() => table.previousPage()}
								disabled={isLoading || !table.getCanPreviousPage()}
							>
								<span className="sr-only">{t($ => $.table.previousPage)}</span>
								<ChevronLeft/>
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={() => table.nextPage()}
								disabled={isLoading || !table.getCanNextPage()}
							>
								<span className="sr-only">{t($ => $.table.nextPage)}</span>
								<ChevronRight/>
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={() => table.lastPage()}
								disabled={isLoading || !table.getCanNextPage()}
							>
								<span className="sr-only">{t($ => $.table.lastPage)}</span>
								<ChevronsRight/>
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
