import {
	isObject,
	isBoolean,
	isString,
	isStringArray,
} from "~/utils/guard";

import type {
	IncomingFWMessage,
} from "./types";



export function isValidFirewallMessage(raw: unknown): raw is IncomingFWMessage {
	if (!isObject(raw)) return false;
	if (!isBoolean(raw.success)) return false;
	if (!isString(raw.message)) return false;

	if (raw.success && !isStringArray(raw.ips)) return false;

	return true;
}
