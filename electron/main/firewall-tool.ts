import { getDB, table, type Select } from "~/db";
import {
	sendToFirewallTool,
	isValidFirewallMessage,
	type FirewallRequest,
	type IncomingFWMessage,
	type WhitelistItem,
} from "~/services/firewall-tool";

import {
	getRecentAccessControlLogs,
	getRecentAccessControlLogsAround,
	type FetchAccessControlLogsOptions,
} from "./queries";



export interface AccessControlLogItem extends Omit<Select<"accessControlLogs">, "ips"> {
	ip?: string;
}

export async function fetchLogs(options?: FetchAccessControlLogsOptions): Promise<AccessControlLogItem[]> {
	const rows = await getRecentAccessControlLogs(options ?? { limit: 10 });
	return rows.flatMap(({ ips, ...row }) => (ips && ips.length > 0 ? ips : [undefined]).map(ip => ({
		...row,
		ip,
	})));
}

export async function fetchLogsAround(targetTimestamp: number, limit = 10): Promise<{
	logs: AccessControlLogItem[];
	hasMoreTop: boolean;
	hasMoreBottom: boolean;
	topOffset: number;
}> {
	const { rows, hasMoreTop, hasMoreBottom, topOffset } = await getRecentAccessControlLogsAround(targetTimestamp, limit);
	const logs = rows.flatMap(({ ips, ...row }) => (ips && ips.length > 0 ? ips : [undefined]).map(ip => ({
		...row,
		ip,
	})));
	return { logs, hasMoreTop, hasMoreBottom, topOffset };
}



async function sendFirewallRequest(request: FirewallRequest): Promise<IncomingFWMessage> {
	try {
		const response = await sendToFirewallTool(request);
		if (!isValidFirewallMessage(response)) {
			return {
				success: false,
				message: "Invalid response from firewall daemon",
			};
		}
		return response;
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function getFirewallStatus(): Promise<IncomingFWMessage> {
	return sendFirewallRequest({ action: "get" });
}

export async function setWhitelist(
	items: string[],
	reason?: string,
): Promise<{
	success: boolean;
	active: boolean;
	whitelist?: WhitelistItem[];
	message?: string;
	logs: AccessControlLogItem[];
}> {
	const db = getDB();
	const response = await sendFirewallRequest({ action: "set", whitelist: items });

	const success = response.success;
	const errorMessage = response.success ? undefined : response.message;
	const active = response.success ? response.active : false;
	let whitelist: WhitelistItem[] | undefined = response.success && response.whitelist ? response.whitelist : undefined;

	// breaking change 대비: set 응답에 whitelist가 포함되지 않은 경우 기존 get 함수(getFirewallStatus)를 활용
	if (success && whitelist === undefined) {
		const getRes = await getFirewallStatus();
		if (getRes.success && getRes.whitelist) {
			whitelist = getRes.whitelist;
		}
	}

	const logReason = reason || "화이트리스트 설정 갱신";

	const rows = await db.insert(table.accessControlLogs).values({
		target: "whitelist",
		action: "add",
		reason: logReason,
		success,
		ips: success ? items : null,
		errorMessage,
	}).returning();

	const logs: AccessControlLogItem[] = rows.flatMap(({ ips, ...row }) =>
		(ips && ips.length > 0 ? ips : [undefined]).map(ip => ({
			...row,
			ip,
		})),
	);

	return {
		success,
		active,
		whitelist,
		message: errorMessage,
		logs,
	};
}

export async function refreshWhitelist(): Promise<IncomingFWMessage> {
	return sendFirewallRequest({ action: "refresh" });
}
