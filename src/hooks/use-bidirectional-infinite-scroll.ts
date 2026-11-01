import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";

export type ScrollDirection = "older" | "newer";

export interface UseBidirectionalInfiniteScrollOptions<T> {
	cachedItems: T[];
	pageSize?: number;
	initialHasMoreBottom?: boolean;
	resetKey?: unknown;
	targetTimestamp?: number;
	targetItemKey?: string;
	getItemTimestamp: (item: T) => number;
	getItemKey: (item: T) => string;
	getRowId?: (item: T, index: number) => string;
	fetchFromElectron: (params: {
		timestamp: number;
		direction: ScrollDirection;
		limit: number;
	}) => Promise<{ items: T[]; hasMore: boolean }>;
	fetchAroundFromElectron: (params: {
		targetTimestamp: number;
		limit: number;
	}) => Promise<{ items: T[]; hasMoreTop: boolean; hasMoreBottom: boolean; topOffset?: number }>;
	onItemsFetched?: (items: T[]) => void;
}

export interface UseBidirectionalInfiniteScrollResult<T> {
	visibleItems: T[];
	hasMoreTop: boolean;
	hasMoreBottom: boolean;
	isLoadingTop: boolean;
	isLoadingBottom: boolean;
	loadMore: (direction: ScrollDirection) => Promise<void>;
	highlightedRowId: string | null;
	setHighlightedRowId: (id: string | null) => void;
	topOffset: number;
}

export function useBidirectionalInfiniteScroll<T>({
	cachedItems,
	pageSize = 15,
	initialHasMoreBottom = true,
	resetKey,
	targetTimestamp,
	targetItemKey,
	getItemTimestamp,
	getItemKey,
	getRowId = (item) => getItemKey(item),
	fetchFromElectron,
	fetchAroundFromElectron,
	onItemsFetched,
}: UseBidirectionalInfiniteScrollOptions<T>): UseBidirectionalInfiniteScrollResult<T> {
	// 아이템 매칭 헬퍼 (targetItemKey 또는 targetTimestamp 매칭)
	const findTargetIndex = useCallback(
		(items: T[], targetTime?: number, targetKey?: string) => {
			if (!targetTime && !targetKey) return -1;
			return items.findIndex((item) => {
				if (targetKey) {
					const key = getItemKey(item);
					if (key === targetKey || targetKey.startsWith(key) || key.startsWith(targetKey)) {
						return true;
					}
				}
				if (targetTime) {
					return Math.abs(getItemTimestamp(item) - targetTime) < 1000;
				}
				return false;
			});
		},
		[getItemKey, getItemTimestamp],
	);

	const [visibleItems, setVisibleItems] = useState<T[]>(() => {
		if (targetTimestamp || targetItemKey) {
			const targetIdx = findTargetIndex(cachedItems, targetTimestamp, targetItemKey);
			if (targetIdx !== -1) {
				const topCount = Math.min(3, targetIdx);
				const startIdx = targetIdx - topCount;
				const endIdx = Math.min(cachedItems.length, startIdx + pageSize);
				return cachedItems.slice(startIdx, endIdx);
			}
		}
		return cachedItems.slice(0, pageSize);
	});
	const [hasMoreTop, setHasMoreTop] = useState(() => {
		if (targetTimestamp || targetItemKey) {
			const targetIdx = findTargetIndex(cachedItems, targetTimestamp, targetItemKey);
			if (targetIdx !== -1) {
				return Math.max(0, targetIdx - Math.min(3, targetIdx)) > 0;
			}
		}
		return false;
	});
	const [hasMoreBottom, setHasMoreBottom] = useState(() => {
		if (targetTimestamp || targetItemKey) {
			const targetIdx = findTargetIndex(cachedItems, targetTimestamp, targetItemKey);
			if (targetIdx !== -1) {
				const topCount = Math.min(3, targetIdx);
				const startIdx = targetIdx - topCount;
				const endIdx = Math.min(cachedItems.length, startIdx + pageSize);
				return endIdx < cachedItems.length || initialHasMoreBottom;
			}
		}
		return cachedItems.length > pageSize || initialHasMoreBottom;
	});
	const [isLoadingTop, setIsLoadingTop] = useState(false);
	const [isLoadingBottom, setIsLoadingBottom] = useState(false);
	const [highlightedRowId, setHighlightedRowId] = useState<string | null>(() => {
		if (targetTimestamp || targetItemKey) {
			const targetIdx = findTargetIndex(cachedItems, targetTimestamp, targetItemKey);
			if (targetIdx !== -1 && cachedItems[targetIdx]) {
				return getRowId(cachedItems[targetIdx]!, targetIdx);
			}
		}
		return null;
	});
	const [topOffset, setTopOffset] = useState(() => {
		if (targetTimestamp || targetItemKey) {
			const targetIdx = findTargetIndex(cachedItems, targetTimestamp, targetItemKey);
			if (targetIdx !== -1) {
				return Math.max(0, targetIdx - Math.min(3, targetIdx));
			}
		}
		return 0;
	});

	const currentKey = `${String(resetKey ?? "")}:${targetItemKey ?? ""}:${targetTimestamp ?? ""}`;
	const [prevKey, setPrevKey] = useState(currentKey);
	const prevResetKeyRef = useRef(resetKey);

	// resetKey 또는 타겟 파라미터 변경 시 렌더링 단계에서 동기적으로 윈도우 슬라이스 및 하이라이트 계산 (0ms 즉각 반영)
	if (prevKey !== currentKey) {
		setPrevKey(currentKey);

		if (targetTimestamp || targetItemKey) {
			const targetIdx = findTargetIndex(cachedItems, targetTimestamp, targetItemKey);
			if (targetIdx !== -1 && cachedItems[targetIdx]) {
				const topCount = Math.min(3, targetIdx);
				const startIdx = targetIdx - topCount;
				const endIdx = Math.min(cachedItems.length, startIdx + pageSize);
				const windowSlice = cachedItems.slice(startIdx, endIdx);
				const targetRowId = getRowId(cachedItems[targetIdx]!, targetIdx);

				setVisibleItems(windowSlice);
				setHasMoreTop(startIdx > 0);
				setHasMoreBottom(endIdx < cachedItems.length || initialHasMoreBottom);
				setTopOffset(startIdx);
				setHighlightedRowId(targetRowId);
			}
		} else if (cachedItems.length > 0) {
			// 탭 전환 시: 최신 데이터부터 한 청크(0 ~ pageSize)만 화면에 표시
			const initialSlice = cachedItems.slice(0, pageSize);
			setVisibleItems(initialSlice);
			setHasMoreTop(false);
			setHasMoreBottom(cachedItems.length > pageSize || initialHasMoreBottom);
			setTopOffset(0);
		} else {
			setVisibleItems([]);
			setHasMoreTop(false);
			setHasMoreBottom(initialHasMoreBottom);
			setTopOffset(0);
		}
	}

	// visibleItems가 비어있다가 cachedItems가 최초로 로드된 경우 (최신순 한 청크)
	if (visibleItems.length === 0 && cachedItems.length > 0 && !targetTimestamp && !targetItemKey) {
		const initialSlice = cachedItems.slice(0, pageSize);
		setVisibleItems(initialSlice);
		setHasMoreTop(false);
		setHasMoreBottom(cachedItems.length > pageSize || initialHasMoreBottom);
		setTopOffset(0);
	}

	// 탭 전환 시 스크롤 위치가 이전 위치에 남아있지 않도록 즉시 최상단(scrollTop = 0)으로 리셋
	useLayoutEffect(() => {
		if (prevResetKeyRef.current === resetKey) return;
		prevResetKeyRef.current = resetKey;

		if (!targetTimestamp && !targetItemKey) {
			const frame = requestAnimationFrame(() => {
				const viewports = document.querySelectorAll(
					"[data-slot=\"scroll-area-viewport\"], [data-slot=\"table-container\"]",
				);
				for (const vp of viewports) {
					vp.scrollTop = 0;
				}
			});
			return () => cancelAnimationFrame(frame);
		}
	}, [resetKey, targetTimestamp, targetItemKey]);

	// 중복 제거 병합 헬퍼
	const mergeUnique = useCallback(
		(targetArr: T[], sourceArr: T[], position: "prepend" | "append"): T[] => {
			const map = new Map<string, T>();
			const combined = position === "prepend" ? [...sourceArr, ...targetArr] : [...targetArr, ...sourceArr];
			for (const item of combined) {
				map.set(getItemKey(item), item);
			}
			// 항상 timestamp 내림차순(최신순) 유지
			return Array.from(map.values()).sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));
		},
		[getItemKey, getItemTimestamp],
	);

	// 비동기 외부 데이터 조회 (캐시에 없는 타겟 또는 빈 캐시 초기 조회)
	useEffect(() => {
		const target = targetTimestamp;

		if (target || targetItemKey) {
			const targetIdx = findTargetIndex(cachedItems, target, targetItemKey);
			if (targetIdx !== -1) return; // 캐시에 존재하는 경우 렌더링 단계에서 이미 윈도우 배치 완료

			// 캐시에 없음: Electron DB에서 target 주변 윈도우 페칭
			if (target) {
				void fetchAroundFromElectron({ targetTimestamp: target, limit: pageSize }).then((res) => {
					if (res.items.length > 0) {
						onItemsFetched?.(res.items);
						setVisibleItems(res.items);
						setHasMoreTop(res.hasMoreTop);
						setHasMoreBottom(res.hasMoreBottom);
						setTopOffset(res.topOffset ?? 0);

						const matchedIdx = findTargetIndex(res.items, target, targetItemKey);
						if (matchedIdx !== -1 && res.items[matchedIdx]) {
							const targetRowId = getRowId(res.items[matchedIdx]!, matchedIdx);
							setHighlightedRowId(targetRowId);
						}
					}
				});
				return;
			}
		}

		// 캐시가 비어있는 초기 로드인 경우에만 Electron에서 첫 페이지 조회
		if (cachedItems.length === 0) {
			void fetchFromElectron({ timestamp: Date.now(), direction: "older", limit: pageSize }).then((res) => {
				if (res.items.length > 0) {
					onItemsFetched?.(res.items);
					setVisibleItems(res.items);
					setHasMoreTop(false);
					setHasMoreBottom(res.hasMore);
					setTopOffset(0);
				}
			});
		}
	}, [
		cachedItems,
		pageSize,
		targetTimestamp,
		targetItemKey,
		findTargetIndex,
		getRowId,
		fetchFromElectron,
		fetchAroundFromElectron,
		onItemsFetched,
	]);

	// 최상단에 머무르고 있는 상태(!hasMoreTop)에서 실시간으로 새 이벤트가 캐시에 추가된 경우
	useEffect(() => {
		if (hasMoreTop) return;
		if (cachedItems.length === 0) return;

		const latestCached = cachedItems[0]!;
		const latestVisible = visibleItems[0];

		if (!latestVisible || getItemTimestamp(latestCached) > getItemTimestamp(latestVisible)) {
			const timer = setTimeout(() => {
				setVisibleItems((prev) => mergeUnique(prev, [latestCached], "prepend"));
			}, 0);
			return () => clearTimeout(timer);
		}
	}, [cachedItems, hasMoreTop, visibleItems, getItemTimestamp, mergeUnique]);

	// 단일 대칭 무한스크롤 함수 (older / newer)
	const loadMore = useCallback(
		async (direction: ScrollDirection) => {
			if (direction === "older" && (!hasMoreBottom || isLoadingBottom)) return;
			if (direction === "newer" && (!hasMoreTop || isLoadingTop)) return;

			if (direction === "older") {
				setIsLoadingBottom(true);
			} else {
				setIsLoadingTop(true);
			}

			try {
				const boundaryItem = direction === "older" ? visibleItems.at(-1) : visibleItems[0];
				if (!boundaryItem) return;

				const boundaryTime = getItemTimestamp(boundaryItem);

				// 1. 이미 로드된 스토어 캐시(cachedItems) 내에서 다음 데이터가 있는지 확인
				let itemsFromCache: T[] = [];
				let moreInCache = false;

				if (direction === "older") {
					const boundaryIdx = cachedItems.findIndex((it) => getItemKey(it) === getItemKey(boundaryItem));
					if (boundaryIdx !== -1) {
						const olderSlice = cachedItems.slice(boundaryIdx + 1);
						itemsFromCache = olderSlice.slice(0, pageSize);
						moreInCache = olderSlice.length > pageSize;
					} else {
						const olderCandidates = cachedItems.filter((item) => getItemTimestamp(item) < boundaryTime);
						itemsFromCache = olderCandidates.slice(0, pageSize);
						moreInCache = olderCandidates.length > pageSize;
					}
				} else {
					const boundaryIdx = cachedItems.findIndex((it) => getItemKey(it) === getItemKey(boundaryItem));
					if (boundaryIdx !== -1) {
						const newerSlice = cachedItems.slice(0, boundaryIdx);
						itemsFromCache = newerSlice.slice(-pageSize);
						moreInCache = newerSlice.length > pageSize;
					} else {
						const newerCandidates = cachedItems.filter((item) => getItemTimestamp(item) > boundaryTime);
						itemsFromCache = newerCandidates.slice(-pageSize);
						moreInCache = newerCandidates.length > pageSize;
					}
				}

				// 캐시에 충분한 개수(pageSize)가 존재하면 캐시에서 즉시 화면 배치 (0ms)
				if (itemsFromCache.length >= pageSize) {
					setVisibleItems((prev) =>
						direction === "older" ? [...prev, ...itemsFromCache] : [...itemsFromCache, ...prev],
					);
					if (direction === "older") {
						setHasMoreBottom(moreInCache || initialHasMoreBottom);
					} else {
						setHasMoreTop(moreInCache);
						setTopOffset((prev) => Math.max(0, prev - itemsFromCache.length));
					}
					return;
				}

				// 2. 캐시 데이터가 부족하거나 소진된 경우 Electron DB에서 조회
				const fetched = await fetchFromElectron({
					timestamp: boundaryTime,
					direction,
					limit: pageSize,
				});

				if (fetched.items.length > 0 || itemsFromCache.length > 0) {
					onItemsFetched?.(fetched.items);
					const combinedToAdd =
						direction === "older"
							? mergeUnique(itemsFromCache, fetched.items, "append")
							: mergeUnique(fetched.items, itemsFromCache, "prepend");

					setVisibleItems((prev) =>
						direction === "older" ? [...prev, ...combinedToAdd] : [...combinedToAdd, ...prev],
					);

					if (direction === "newer") {
						setTopOffset((prev) => Math.max(0, prev - combinedToAdd.length));
					}
				}

				if (direction === "older") {
					setHasMoreBottom(moreInCache || fetched.hasMore || initialHasMoreBottom);
				} else {
					setHasMoreTop(moreInCache || fetched.hasMore);
				}
			} catch (err) {
				console.error(`[useBidirectionalInfiniteScroll:loadMore(${direction})] failed:`, err);
			} finally {
				if (direction === "older") {
					setIsLoadingBottom(false);
				} else {
					setIsLoadingTop(false);
				}
			}
		},
		[
			visibleItems,
			cachedItems,
			pageSize,
			hasMoreTop,
			hasMoreBottom,
			isLoadingTop,
			isLoadingBottom,
			initialHasMoreBottom,
			getItemTimestamp,
			getItemKey,
			fetchFromElectron,
			onItemsFetched,
			mergeUnique,
		],
	);

	return {
		visibleItems,
		hasMoreTop,
		hasMoreBottom,
		isLoadingTop,
		isLoadingBottom,
		loadMore,
		highlightedRowId,
		setHighlightedRowId,
		topOffset,
	};
}
