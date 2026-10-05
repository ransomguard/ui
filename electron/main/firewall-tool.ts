import { getDB, table, type Select } from "~/db";
import { maybeStringArray, isString, isObject } from "~/utils/guard";
import { sendToFirewallTool, isValidFirewallMessage, type FirewallRequest } from "~/services/firewall-tool";



export async function fetchIPs(
	target: FirewallRequest["target"],
) {
	const action = "list" as const;
	const data = { target, action };

	const response = await sendToFirewallTool(data);
	if (!isValidFirewallMessage(response, action)) return;

	return response;
}

export async function actionAndLogging(
	target: FirewallRequest["target"],
	action: Exclude<FirewallRequest["action"], "list">,
	obj: unknown,
): Promise<Select<"accessControlLogs">[] | undefined> {
	const db = getDB();

	if (!isObject(obj)) return;
	const { ips, reason } = obj;
	if (!ips || !maybeStringArray(ips)) return;
	if (!isString(reason)) return;
	const data = { target, action, ips, reason };

	const response = await sendToFirewallTool(data);
	if (!isValidFirewallMessage(response, action)) return;
	const { success, message } = response;

	return await db.insert(table.accessControlLogs).values({
		target, action, reason, success,
		ips: success ? response.ips : null,
		errorMessage: message,
	}).returning();
}
