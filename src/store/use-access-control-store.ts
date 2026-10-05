import { create } from "zustand";

import { toast } from "@/components/ui/toast";



export interface RuleState {
	blockedIps: string[];
	whitelistIps: string[];
	logs: AccessControlLogItem[];
	isLoading: boolean;
	error: string | null;

	fetchRules: () => Promise<void>;
	blockIp: (ips: string[], reason: string) => Promise<void>;
	unblockIp: (ips: string[], reason: string) => Promise<void>;
	addWhitelist: (ips: string[], reason: string) => Promise<void>;
	removeWhitelist: (ips: string[], reason: string) => Promise<void>;
}



export const useAccessControlStore = create<RuleState>((set, get) => ({
	blockedIps: [],
	whitelistIps: [],
	logs: [],
	isLoading: false,
	error: null,

	fetchRules: async () => {
		if (get().isLoading) return;
		set({ isLoading: true, error: null });
		try {
			const [logs, blockedRes, whitelistRes] = await Promise.all([
				window.electronAPI.getAccessControlLogs(),
				window.electronAPI.getBlockedIPs(),
				window.electronAPI.getWhitelistedIPs(),
			]);

			const errorMsg = !blockedRes?.success
				? blockedRes?.message
				: !whitelistRes?.success
					? whitelistRes?.message
					: null;

			set({
				blockedIps: blockedRes?.success ? blockedRes.ips : [],
				whitelistIps: whitelistRes?.success ? whitelistRes.ips : [],
				logs,
				error: errorMsg ?? null,
			});

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

	blockIp: async (ips, reason) => {
		const logs = await window.electronAPI.addBlockedIPs(ips, reason);
		const failedLog = logs.find(x => !x.success);

		set(prev => ({
			blockedIps: failedLog
				? prev.blockedIps
				: logs.map(x => x.ip).filter((x): x is string => x !== undefined),
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

		set(prev => ({
			blockedIps: failedLog
				? prev.blockedIps
				: logs.map(x => x.ip).filter((x): x is string => x !== undefined),
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

		set(prev => ({
			whitelistIps: failedLog
				? prev.whitelistIps
				: logs.map(x => x.ip).filter((x): x is string => x !== undefined),
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

		set(prev => ({
			whitelistIps: failedLog
				? prev.whitelistIps
				: logs.map(x => x.ip).filter((x): x is string => x !== undefined),
			logs: [...logs, ...prev.logs],
			error: failedLog ? (failedLog.errorMessage ?? null) : null,
		}));

		if (failedLog) {
			throw new Error(failedLog.errorMessage ?? "Failed to remove whitelisted IP");
		}
	},
}));
