import { useCallback } from "react";
import { useSearchParams } from "react-router";

export interface UseSearchParamTabOptions<T extends string> {
	paramName?: string;
	defaultTab: T;
	validTabs?: readonly T[];
}

export function resolveSearchParamTab<T extends string>(
	searchParams: URLSearchParams,
	paramName: string,
	defaultTab: T,
	validTabs?: readonly T[],
): T {
	let currentParam = searchParams.get(paramName) as T | null;
	if (!currentParam && paramName === "tab") {
		currentParam = searchParams.get("filter") as T | null;
	}
	if (currentParam && (!validTabs || validTabs.includes(currentParam))) {
		return currentParam;
	}
	return defaultTab;
}

/**
 * URL Search Params를 기반으로 탭 상태를 관리하는 훅
 * - 새로고침(F5) 시 URL에 쿼리 스트링이 남아있어 마지막 탭이 자연스럽게 유지됨
 * - 다른 페이지로 이동 시 URL이 바뀌므로 자연스럽게 초기화됨
 */
export function useSearchParamTab<T extends string>({
	paramName = "tab",
	defaultTab,
	validTabs,
}: UseSearchParamTabOptions<T>): [T, (tab: T | null | undefined) => void] {
	const [searchParams, setSearchParams] = useSearchParams();

	const activeTab = resolveSearchParamTab(searchParams, paramName, defaultTab, validTabs);

	const setActiveTab = useCallback(
		(nextTab: T | null | undefined) => {
			const target = (nextTab as T) ?? defaultTab;
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					next.set(paramName, target);
					if (paramName === "tab") {
						next.delete("filter");
					}
					// 탭을 수동 전환할 때는 이전 하이라이트 파라미터가 있다면 제거
					next.delete("highlightId");
					next.delete("target");
					next.delete("itemKey");
					next.delete("timestamp");
					return next;
				},
				{ replace: true, preventScrollReset: true },
			);
		},
		[defaultTab, paramName, setSearchParams],
	);

	return [activeTab, setActiveTab];
}
