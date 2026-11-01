import { describe, it, expect } from "bun:test";
import { resolveSearchParamTab } from "@/hooks/use-search-param-tab";

describe("resolveSearchParamTab", () => {
	it("URL에 탭 파라미터가 없을 때 defaultTab을 반환한다", () => {
		const searchParams = new URLSearchParams();
		const tab = resolveSearchParamTab(
			searchParams,
			"tab",
			"default-tab",
			["default-tab", "custom-tab"] as const,
		);

		expect(tab).toBe("default-tab");
	});

	it("URL에 search param(예: ?tab=custom-tab)이 존재하면 새로고침 시에도 해당 탭을 읽는다", () => {
		const searchParams = new URLSearchParams("tab=custom-tab");
		const tab = resolveSearchParamTab(
			searchParams,
			"tab",
			"default-tab",
			["default-tab", "custom-tab"] as const,
		);

		expect(tab).toBe("custom-tab");
	});

	it("URL에 유효하지 않은 탭 파라미터가 있을 경우 defaultTab으로 fallback한다", () => {
		const searchParams = new URLSearchParams("tab=invalid-tab");
		const tab = resolveSearchParamTab(
			searchParams,
			"tab",
			"default-tab",
			["default-tab", "custom-tab"] as const,
		);

		expect(tab).toBe("default-tab");
	});

	it("탭을 전환하여 URL search param을 갱신할 때 highlight 관련 파라미터를 정리한다", () => {
		const searchParams = new URLSearchParams("tab=first&highlightId=row-123&target=192.168.1.1&itemKey=key-1&timestamp=1000");

		// 탭 전환 로직 검증
		searchParams.set("tab", "second");
		searchParams.delete("highlightId");
		searchParams.delete("target");
		searchParams.delete("itemKey");
		searchParams.delete("timestamp");

		expect(searchParams.get("tab")).toBe("second");
		expect(searchParams.has("highlightId")).toBe(false);
		expect(searchParams.has("target")).toBe(false);
		expect(searchParams.has("itemKey")).toBe(false);
		expect(searchParams.has("timestamp")).toBe(false);
	});
});
