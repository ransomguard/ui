import { create } from "zustand";

import { toast } from "@/components/ui/toast";
import { useMetricStore } from "./use-metrics-store";



const PAGE_SIZE = 10;

export interface RuleState {
	blockedIps: string[];
	whitelistIps: string[];
	logs: AccessControlLogItem[];
	hasMoreLogs: boolean;
	hasMoreTopLogs: boolean;
	isLoadingMoreLogs: boolean;
	isLoadingMoreTopLogs: boolean;
	isInitialized: boolean;
	isLoading: boolean;
	error: string | null;

	fetchRules: (force?: boolean) => Promise<void>;
	addLogs: (logs: AccessControlLogItem[]) => void;
	fetchMoreLogs: () => Promise<void>;
	fetchMoreLogsTop: () => Promise<void>;
	loadLogsAround: (timestamp: number) => Promise<boolean>;
	blockIp: (ips: string[], reason: string) => Promise<void>;
	unblockIp: (ips: string[], reason: string) => Promise<void>;
	addWhitelist: (ips: string[], reason: string) => Promise<void>;
	removeWhitelist: (ips: string[], reason: string) => Promise<void>;
}



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
	blockedIps: [],
	whitelistIps: [],
	logs: [],
	hasMoreLogs: true,
	hasMoreTopLogs: false,
	isLoadingMoreLogs: false,
	isLoadingMoreTopLogs: false,
	isInitialized: false,
	isLoading: false,
	error: null,

	fetchRules: async (force = false) => {
		if (get().isLoading || (get().isInitialized && !force)) return;
		set({ isLoading: true, error: null });
		try {
			const [logs, blockedRes, whitelistRes] = await Promise.all([
				window.electronAPI.getAccessControlLogs({ limit: PAGE_SIZE }),
				window.electronAPI.getBlockedIPs(),
				window.electronAPI.getWhitelistedIPs(),
			]);

			const errorMsg = !blockedRes?.success
				? blockedRes?.message
				: !whitelistRes?.success
					? whitelistRes?.message
					: null;

			set((prev) => ({
				blockedIps: blockedRes?.success ? blockedRes.ips : [],
				whitelistIps: whitelistRes?.success ? whitelistRes.ips : [],
				logs: mergeAccessLogs(prev.logs, logs),
				hasMoreLogs: logs.length >= PAGE_SIZE,
				isInitialized: true,
				error: errorMsg ?? null,
			}));

			if (errorMsg) {
				toast.add({
					id: errorMsg,
					title: errorMsg,
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

	blockIp: async (ips, reason) => {
		const logs = await window.electronAPI.addBlockedIPs(ips, reason);
		const failedLog = logs.find(x => !x.success);
		useMetricStore.getState().incrementAccessLogCount(logs.length);

		set(prev => ({
			blockedIps: failedLog
				? prev.blockedIps
				: Array.from(new Set([...prev.blockedIps, ...ips])),
			logs: [...logs, ...prev.logs],
			error: failedLog ? (failedLog.errorMessage ?? null) : null,
		}));

		if (failedLog) {
			throw new Error(failedLog.errorMessage ?? "Failed to add blocked IP");
		}
	},

	unblockIp: async (ips, reason) => {
		const logs = await window.electronAPI.removeBlockedIPs(ips, reason);
		const failedLog = logs.find(x => !x.success);
		useMetricStore.getState().incrementAccessLogCount(logs.length);

		set(prev => ({
			blockedIps: failedLog
				? prev.blockedIps
				: prev.blockedIps.filter(ip => !ips.includes(ip)),
			logs: [...logs, ...prev.logs],
			error: failedLog ? (failedLog.errorMessage ?? null) : null,
		}));

		if (failedLog) {
			throw new Error(failedLog.errorMessage ?? "Failed to remove blocked IP");
		}
	},

	addWhitelist: async (ips, reason) => {
		const logs = await window.electronAPI.addWhitelistedIPs(ips, reason);
		const failedLog = logs.find(x => !x.success);
		useMetricStore.getState().incrementAccessLogCount(logs.length);

		set(prev => ({
			whitelistIps: failedLog
				? prev.whitelistIps
				: Array.from(new Set([...prev.whitelistIps, ...ips])),
			logs: [...logs, ...prev.logs],
			error: failedLog ? (failedLog.errorMessage ?? null) : null,
		}));

		if (failedLog) {
			throw new Error(failedLog.errorMessage ?? "Failed to add whitelisted IP");
		}
	},

	removeWhitelist: async (ips, reason) => {
		const logs = await window.electronAPI.removeWhitelistedIPs(ips, reason);
		const failedLog = logs.find(x => !x.success);
		useMetricStore.getState().incrementAccessLogCount(logs.length);

		set(prev => ({
			whitelistIps: failedLog
				? prev.whitelistIps
				: prev.whitelistIps.filter(ip => !ips.includes(ip)),
			logs: [...logs, ...prev.logs],
			error: failedLog ? (failedLog.errorMessage ?? null) : null,
		}));

		if (failedLog) {
			throw new Error(failedLog.errorMessage ?? "Failed to remove whitelisted IP");
		}
	},
}));
