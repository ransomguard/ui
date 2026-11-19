import { managedJevItem, isManagedJevValue } from "~/services/firewall-tool/managed-jev";
import { getDB, table, type Select } from "~/db";
import { withPolicyOwner } from "~/services/firewall-tool/policy-owner";
import {
	sendToFirewallTool,
	isValidFirewallMessage,
	type FirewallRequest,
	type IncomingFWMessage,
	type WhitelistItem,
	type FirewallResponseDirection,
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
		if ((request.action === "add" || request.action === "remove") && request.whitelist?.some(isManagedJevValue)) {
            return { success:false, message:"JEV(TypeSafe)는 시스템 관리 항목으로 수정·삭제할 수 없습니다." };
        }
        const outbound = request.action === "set" ? {...request, whitelist:request.whitelist?.filter(v=>!isManagedJevValue(v))} : request;
        const response = await withPolicyOwner(outbound, () => sendToFirewallTool(outbound));
		if (!isValidFirewallMessage(response)) {
			return {
				success: false,
				message: "Invalid response from firewall daemon",
			};
		}
		if (response.success && response.whitelist === undefined && request.action !== "get") {
            const current = await sendFirewallRequest({action:"get"});
            if (current.success) response.whitelist=current.whitelist;
        }
        if (response.success) response.whitelist = [await managedJevItem(), ...(response.whitelist ?? []).filter(item=>!isManagedJevValue(item.value))];
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

export interface MutateWhitelistResult {
	success: boolean;
	active: boolean;
	direction?: FirewallResponseDirection;
	whitelist?: WhitelistItem[];
	message?: string;
	logs: AccessControlLogItem[];
}

async function mutateWhitelist(
	action: "add" | "remove" | "set",
	items: string[],
	reason?: string,
): Promise<MutateWhitelistResult> {
	const db = getDB();
	const response = await sendFirewallRequest({ action, whitelist: items });

	const success = response.success;
	const errorMessage = response.success ? undefined : response.message;
	const active = response.success ? response.active : false;
	let whitelist: WhitelistItem[] | undefined = response.success && response.whitelist ? response.whitelist : undefined;

	// 응답에 whitelist가 누락된 경우 get으로 fallback
	if (success && whitelist === undefined) {
		const getRes = await getFirewallStatus();
		if (getRes.success && getRes.whitelist) {
			whitelist = getRes.whitelist;
		}
	}

	const defaultReason = action === "add"
		? `화이트리스트 추가 (${items.join(", ")})`
		: action === "remove"
		? `화이트리스트 삭제 (${items.join(", ")})`
		: "화이트리스트 설정 갱신";
	const logReason = reason || defaultReason;
	const logAction = action === "remove" ? "remove" : "add";

	const rows = await db.insert(table.accessControlLogs).values({
		target: "whitelist",
		action: logAction,
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
		direction: response.success ? response.direction : undefined,
		whitelist,
		message: errorMessage,
		logs,
	};
}

export async function addWhitelist(items: string[], reason?: string) {
	return mutateWhitelist("add", items, reason);
}

export async function removeWhitelist(items: string[], reason?: string) {
	return mutateWhitelist("remove", items, reason);
}

export async function setWhitelist(items: string[], reason?: string) {
	return mutateWhitelist("set", items, reason);
}

export async function refreshWhitelist(): Promise<IncomingFWMessage> {
	return sendFirewallRequest({ action: "refresh" });
}
