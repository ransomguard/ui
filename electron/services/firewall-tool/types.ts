export type FirewallAction = "on" | "off" | "set" | "get" | "refresh";

export interface FirewallRequest {
	action: FirewallAction;
	whitelist?: string[];
}

export type WhitelistItemType = "ipv4" | "ipv6" | "domain" | "url";

export interface WhitelistItemIPv4Data {
	ipv4: string;
	port: number;
	cidr: number;
}

export interface WhitelistItemIPv6Data {
	ipv6: string;
	port: number;
	cidr: number;
}

export interface WhitelistItemDomainData {
	domain: string;
	port: number;
	ipv4: string[];
	ipv6: string[];
}

export interface WhitelistItemUrlData {
	domain: string;
	port: number;
	ipv4: string[];
	ipv6: string[];
}

export type WhitelistItemData =
	| WhitelistItemIPv4Data
	| WhitelistItemIPv6Data
	| WhitelistItemDomainData
	| WhitelistItemUrlData;

export interface WhitelistItem {
	type: WhitelistItemType;
	value: string;
	data: WhitelistItemData;
}

export interface FWSuccessData {
	success: true;
	active: boolean;
	action: FirewallAction;
	whitelist?: WhitelistItem[];
}

export interface FWFailureData {
	success: false;
	action?: FirewallAction;
	message: string;
}

export type IncomingFWMessage = FWSuccessData | FWFailureData;
