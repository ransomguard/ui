import {
	isObject,
	isBoolean,
	isString,
} from "~/utils/guard";

import type {
	IncomingFWMessage,
} from "./types";



export function isValidFirewallMessage(raw: unknown): raw is IncomingFWMessage {
	if (!isObject(raw)) return false;
	if (!isBoolean(raw.success)) return false;

	if (raw.success) {
		if (!isBoolean(raw.active)) return false;
		if (!isString(raw.action)) return false;
		if (raw.whitelist !== undefined && !Array.isArray(raw.whitelist)) return false;
		return true;
	}

	if (!isString(raw.message)) return false;
	return true;
}
