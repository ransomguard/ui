import {
	isObject,
	isBoolean,
	isString,
} from "~/utils/guard";

import type {
	IncomingFWMessage,
} from "./types";



const VALID_ACTIONS = new Set([
	"on",
	"off",
	"set",
	"get",
	"refresh",
	"add",
	"remove",
]);

const VALID_DIRECTIONS = new Set([
	"both",
	"outbound",
	"inbound",
]);

export function isValidFirewallMessage(raw: unknown): raw is IncomingFWMessage {
	if (!isObject(raw)) return false;
	if (!isBoolean(raw.success)) return false;

	if (raw.success) {
		if (!isBoolean(raw.active)) return false;
		if (!isString(raw.action) || !VALID_ACTIONS.has(raw.action)) return false;
		if (
			"direction" in raw
			&& raw.direction !== undefined
			&& (
				!isString(raw.direction)
				|| !VALID_DIRECTIONS.has(raw.direction)
			)
		) {
			return false;
		}
		if (raw.whitelist !== undefined && !Array.isArray(raw.whitelist)) return false;
		return true;
	}

	if (!isString(raw.message)) return false;
	if (
		"action" in raw
		&& raw.action !== undefined
		&& (
			!isString(raw.action)
			|| !VALID_ACTIONS.has(raw.action)
		)
	) {
		return false;
	}

	return true;
}
