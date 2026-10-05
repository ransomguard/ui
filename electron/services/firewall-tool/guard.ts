import {
	isObject,
	isBoolean,
	isString,
	isStringArray,
} from "~/utils/guard";

import type {
	IncomingFWMessage,
} from "./types";



export function isValidFirewallMessage(raw: unknown, action: string): raw is IncomingFWMessage {
	if (!isObject(raw)) return false;
	if (!isBoolean(raw.success)) return false;
	if (!isString(raw.message)) return false;

	switch (action) {
		case "add":
		case "remove":
			if (!isStringArray(raw.ips)) return false;
	}

	return true;
}
