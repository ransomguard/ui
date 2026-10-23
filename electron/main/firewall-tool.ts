import { getDB, table, type Select } from "~/db";
import { maybeStringArray, isString } from "~/utils/guard";
import {
	sendToFirewallTool,
	isValidFirewallMessage,
	type FirewallRequest,
	type IncomingFWMessage,
} from "~/services/firewall-tool";

import { getRecentAccessControlLogs } from "./queries";



export interface AccessControlLogItem extends Omit<Select<"accessControlLogs">, "ips"> {
	ip?: string;
}

export async function fetchLogs(): Promise<AccessControlLogItem[]> {
	const rows = await getRecentAccessControlLogs(100);
	return rows.flatMap(({ ips, ...row }) => (ips && ips.length > 0 ? ips : [undefined]).map(ip => ({
		...row,
		ip,
	})));
}



export async function fetchIPs(
	target: FirewallRequest["target"],
): Promise<IncomingFWMessage> {
	const action = "list" as const;
	const data = { target, action };

	try {
		const response = await sendToFirewallTool(data);
		if (!isValidFirewallMessage(response)) {
			return {
				success: false,
				message: "Invalid response from firewall tool",
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



export async function actionAndLogging(
	target: FirewallRequest["target"],
	action: Exclude<FirewallRequest["action"], "list">,
	...args: unknown[]
): Promise<AccessControlLogItem[]> {
	const db = getDB();
	const [ips, reason] = args;

	if (!maybeStringArray(ips) || !ips) {
		throw new Error("Invalid input: ips must be an array of strings");
	}
	if (!isString(reason)) {
		throw new Error("Invalid input: reason must be a string");
	}
	const data = { target, action, ips, reason };

	let response: IncomingFWMessage;
	try {
		const raw = await sendToFirewallTool(data);
		if (!isValidFirewallMessage(raw)) {
			response = {
				success: false,
				message: "Invalid response from firewall tool",
			};
		} else {
			response = raw;
		}
	} catch (error) {
		response = {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
	const { success, message } = response;

	const rows = await db.insert(table.accessControlLogs).values({
		target, action, reason, success,
		ips: success ? ips : null,
		errorMessage: message,
	}).returning();

	// ips가 null이면 에러가 발생했다는 의미이므로 ip 없이 에러 로그를 넘김
	return rows.flatMap(({ ips, ...row }) => (ips && ips.length > 0 ? ips : [undefined]).map(ip => ({
		...row,
		ip,
	})));
}
