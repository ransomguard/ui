import { create } from "zustand";

import { toast } from "@/components/ui/toast";
import { useMetricStore } from "./use-metrics-store";



const PAGE_SIZE = 10;

export interface RuleState {
	isFirewallActive: boolean;
	whitelistItems: WhitelistItem[];
	whitelistIps: string[];
	logs: AccessControlLogItem[];
	hasMoreLogs: boolean;
	hasMoreTopLogs: boolean;
	isLoadingMoreLogs: boolean;
	isLoadingMoreTopLogs: boolean;
	isInitialized: boolean;
	isLoading: boolean;
	isRefreshing: boolean;
	error: string | null;

	getFirewallStatus: () => Promise<IncomingFWMessage>;
	fetchRules: (force?: boolean) => Promise<void>;
	addLogs: (logs: AccessControlLogItem[]) => void;
	fetchMoreLogs: () => Promise<void>;
	fetchMoreLogsTop: () => Promise<void>;
	loadLogsAround: (timestamp: number) => Promise<boolean>;
	setWhitelist: (items: string[], reason?: string) => Promise<void>;
	addWhitelist: (items: string[], reason?: string) => Promise<void>;
	removeWhitelist: (items: string[], reason?: string) => Promise<void>;
	refreshWhitelist: () => Promise<void>;
}



const applyFirewallStatus = (
	res: { success: boolean; active?: boolean; whitelist?: WhitelistItem[]; message?: string },
	set: (partial: Partial<RuleState> | ((prev: RuleState) => Partial<RuleState>)) => void,
) => {
	if (res.success) {
		const isFirewallActive = res.active ?? false;
		if (res.whitelist !== undefined) {
			const whitelistItems = res.whitelist;
			const whitelistIps = whitelistItems.map(item => item.value);
			set({
				isFirewallActive,
				whitelistItems,
				whitelistIps,
				error: null,
			});
		} else {
			set({ isFirewallActive, error: null });
		}
	} else if (res.message) {
		set({ error: res.message });
	}
};

const mergeAccessLogs = (existing: AccessControlLogItem[], incoming: AccessControlLogItem[]) => {
	const map = new Map<string, AccessControlLogItem>();
	for (const log of existing) {
		map.set(`${log.id}-${log.ip ?? ""}`, log);
	}
	for (const log of incoming) {
		map.set(`${log.id}-${log.ip ?? ""}`, log);
	}
	return Array.from(map.values()).sort((a, b) => b.performedAt - a.performedAt);
};

export const useAccessControlStore = create<RuleState>((set, get) => ({
	isFirewallActive: false,
	whitelistItems: [],
	whitelistIps: [],
	logs: [],
	hasMoreLogs: true,
	hasMoreTopLogs: false,
	isLoadingMoreLogs: false,
	isLoadingMoreTopLogs: false,
	isInitialized: false,
	isLoading: false,
	isRefreshing: false,
	error: null,

	getFirewallStatus: async () => {
		const res = await window.electronAPI.getFirewallStatus();
		applyFirewallStatus(res, set);
		return res;
	},

	fetchRules: async (force = false) => {
		if (get().isLoading || (get().isInitialized && !force)) return;
		set({ isLoading: true, error: null });
		try {
			const [logs, fwStatus] = await Promise.all([
				window.electronAPI.getAccessControlLogs({ limit: PAGE_SIZE }),
				get().getFirewallStatus(),
			]);

			set((prev) => ({
				logs: mergeAccessLogs(prev.logs, logs),
				hasMoreLogs: logs.length >= PAGE_SIZE,
				isInitialized: true,
			}));

			if (!fwStatus.success && fwStatus.message) {
				toast.add({
					id: fwStatus.message,
					title: fwStatus.message,
					type: "error",
				});
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error("[useAccessControlStore] fetchRules failed:", err);
			set({ error: message });
			toast.add({
				id: message,
				title: message,
				type: "error",
			});
		} finally {
			set({ isLoading: false });
		}
	},

	addLogs: (newLogs) => {
		if (newLogs.length === 0) return;
		set((prev) => ({
			logs: mergeAccessLogs(prev.logs, newLogs),
		}));
	},

	fetchMoreLogs: async () => {
		const { logs, hasMoreLogs, isLoadingMoreLogs, isLoading } = get();
		if (!hasMoreLogs || isLoadingMoreLogs || isLoading) return;

		set({ isLoadingMoreLogs: true });
		try {
			const oldestTimestamp = logs.length > 0 ? logs.at(-1)!.performedAt : undefined;
			const nextLogs = await window.electronAPI.getAccessControlLogs({
				beforeTimestamp: oldestTimestamp,
				limit: PAGE_SIZE,
			});

			set((prev) => ({
				logs: mergeAccessLogs(prev.logs, nextLogs),
				hasMoreLogs: nextLogs.length >= PAGE_SIZE,
			}));
		} catch (err) {
			console.error("[useAccessControlStore] fetchMoreLogs failed:", err);
		} finally {
			set({ isLoadingMoreLogs: false });
		}
	},

	fetchMoreLogsTop: async () => {
		const { logs, hasMoreTopLogs, isLoadingMoreTopLogs, isLoading } = get();
		if (!hasMoreTopLogs || isLoadingMoreTopLogs || isLoading || logs.length === 0) return;

		set({ isLoadingMoreTopLogs: true });
		try {
			const newestTimestamp = logs[0]?.performedAt;
			if (newestTimestamp === undefined) return;
			const nextLogs = await window.electronAPI.getAccessControlLogs({
				afterTimestamp: newestTimestamp,
				limit: PAGE_SIZE,
				direction: "newer",
			});

			set((prev) => ({
				logs: mergeAccessLogs(prev.logs, nextLogs),
				hasMoreTopLogs: nextLogs.length >= PAGE_SIZE,
			}));
		} catch (err) {
			console.error("[useAccessControlStore] fetchMoreLogsTop failed:", err);
		} finally {
			set({ isLoadingMoreTopLogs: false });
		}
	},

	loadLogsAround: async (timestamp: number) => {
		try {
			const result = await window.electronAPI.getAccessControlLogsAround(timestamp, PAGE_SIZE);
			if (result.logs.length > 0) {
				set({
					logs: result.logs,
					hasMoreTopLogs: result.hasMoreTop,
					hasMoreLogs: result.hasMoreBottom,
				});
				return true;
			}
			return false;
		} catch (err) {
			console.error("[useAccessControlStore] loadLogsAround failed:", err);
			return false;
		}
	},

	setWhitelist: async (items, reason) => {
		const res = await window.electronAPI.setWhitelist(items, reason);
		useMetricStore.getState().incrementAccessLogCount(res.logs.length);

		set((prev) => ({
			logs: mergeAccessLogs(prev.logs, res.logs),
			error: res.message ?? null,
		}));

		// 응답에 whitelist가 포함되어 있다면 실시간 반영
		if (res.whitelist !== undefined) {
			applyFirewallStatus(res, set);
		} else {
			// breaking change로 set 응답에 whitelist가 누락될 경우 기존 get 함수를 활용하여 실시간 반영
			await get().getFirewallStatus();
		}

		if (!res.success) {
			throw new Error(res.message ?? "화이트리스트 설정에 실패했습니다.");
		}
	},

	addWhitelist: async (items, reason) => {
		// CLI나 타 프로세스가 변경했을 수 있으므로 기존 get 함수로 최신 상태 조회 및 스토어 실시간 반영
		let currentValues = get().whitelistIps;
		try {
			const statusRes = await get().getFirewallStatus();
			if (statusRes.success && statusRes.whitelist) {
				currentValues = statusRes.whitelist.map((x) => x.value);
			}
		} catch (err) {
			console.warn("[useAccessControlStore] getFirewallStatus before addWhitelist failed:", err);
		}

		const nextValues = Array.from(new Set([...currentValues, ...items]));
		await get().setWhitelist(nextValues, reason || `화이트리스트 추가 (${items.join(", ")})`);
	},

	removeWhitelist: async (items, reason) => {
		// CLI나 타 프로세스가 변경했을 수 있으므로 기존 get 함수로 최신 상태 조회 및 스토어 실시간 반영
		let currentValues = get().whitelistIps;
		try {
			const statusRes = await get().getFirewallStatus();
			if (statusRes.success && statusRes.whitelist) {
				currentValues = statusRes.whitelist.map((x) => x.value);
			}
		} catch (err) {
			console.warn("[useAccessControlStore] getFirewallStatus before removeWhitelist failed:", err);
		}

		const nextValues = currentValues.filter((x) => !items.includes(x));
		await get().setWhitelist(nextValues, reason || `화이트리스트 삭제 (${items.join(", ")})`);
	},

	refreshWhitelist: async () => {
		set({ isRefreshing: true });
		try {
			const res = await window.electronAPI.refreshWhitelist();
			if (!res.success) {
				throw new Error(res.message);
			}
			// 응답에 whitelist가 포함되어 있다면 실시간 반영
			if (res.whitelist !== undefined) {
				applyFirewallStatus(res, set);
			} else {
				// 누락 시 기존 get 함수를 활용하여 실시간 반영
				await get().getFirewallStatus();
			}
		} finally {
			set({ isRefreshing: false });
		}
	},
}));
