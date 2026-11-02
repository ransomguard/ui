import fs from "node:fs";
import net from "node:net";
import { beforeAll, afterAll } from "bun:test";

import {
	externalIPCReceiver,
	isValidIPCMessage,
	type IncomingIPCMessage,
} from "~/services/ipc-receiver";
import type {
	FirewallRequest,
	IncomingFWMessage,
	WhitelistItem,
} from "~/services/firewall-tool";
import {
	sendToFirewallTool,
	isValidFirewallMessage,
} from "~/services/firewall-tool";
import * as tray from "~/main/tray";
import {
	useStatusStore,
	useMetricStore,
	useAlertStore,
	useTelemetryStore,
} from "@/store";
import type { AccessControlLogItem } from "~/main/firewall-tool";

import { FW_TEST_PIPE_NAME, IPC_TEST_PIPE_NAME } from "./common";



function parseMockWhitelistItem(value: string): WhitelistItem {
	if (value.startsWith("http://") || value.startsWith("https://")) {
		try {
			const u = new URL(value);
			const port = u.port ? Number(u.port) : (u.protocol === "https:" ? 443 : 80);
			return {
				type: "url",
				value,
				data: { domain: u.hostname, port, ipv4: ["192.168.0.1"], ipv6: [] },
			};
		} catch {
			// fallback
		}
	}
	if (value.includes("::")) {
		return {
			type: "ipv6",
			value,
			data: { ipv6: value, port: 0, cidr: 64 },
		};
	}
	if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(value)) {
		const parts = value.split(":");
		const domain = parts[0] || value;
		const port = parts[1] ? Number(parts[1]) : 0;
		return {
			type: "domain",
			value,
			data: { domain, port, ipv4: ["93.184.216.34"], ipv6: [] },
		};
	}
	const parts = value.split(":");
	const ipOrCidr = parts[0] || value;
	const port = parts[1] ? Number(parts[1]) : 0;
	const [ip, cidrStr] = ipOrCidr.split("/");
	return {
		type: "ipv4",
		value,
		data: { ipv4: ip || value, port, cidr: cidrStr ? Number(cidrStr) : 32 },
	};
}

let mockActive = false;
const mockWhitelistMap = new Map<string, WhitelistItem>([
	["10.0.0.1", parseMockWhitelistItem("10.0.0.1")],
	["192.168.0.10:8080", parseMockWhitelistItem("192.168.0.10:8080")],
	["example.com", parseMockWhitelistItem("example.com")],
]);

const mockAccessControlLogs: AccessControlLogItem[] = [];
let logIdCounter = 0;

function handleFakeFirewallRequest(req: FirewallRequest): IncomingFWMessage {
	switch (req.action) {
		case "on": {
			mockActive = true;
			if (Array.isArray(req.whitelist)) {
				mockWhitelistMap.clear();
				for (const item of req.whitelist) {
					mockWhitelistMap.set(item, parseMockWhitelistItem(item));
				}
			}
			return {
				success: true,
				active: true,
				action: "on",
				whitelist: Array.from(mockWhitelistMap.values()),
			};
		}
		case "off": {
			mockActive = false;
			return {
				success: true,
				active: false,
				action: "off",
			};
		}
		case "get": {
			return {
				success: true,
				active: mockActive,
				action: "get",
				whitelist: Array.from(mockWhitelistMap.values()),
			};
		}
		case "refresh": {
			return {
				success: true,
				active: mockActive,
				action: "refresh",
				whitelist: Array.from(mockWhitelistMap.values()),
			};
		}
		case "set": {
			if (Array.isArray(req.whitelist) && req.whitelist.includes("invalid://error")) {
				return {
					success: false,
					action: "set",
					message: "유효하지 않은 화이트리스트 대상 형식입니다.",
				};
			}
			if (Array.isArray(req.whitelist)) {
				mockWhitelistMap.clear();
				for (const item of req.whitelist) {
					mockWhitelistMap.set(item, parseMockWhitelistItem(item));
				}
			}
			return {
				success: true,
				active: mockActive,
				action: "set",
				whitelist: Array.from(mockWhitelistMap.values()),
			};
		}
		default: {
			return {
				success: false,
				message: "지원하지 않는 요청 action입니다.",
			};
		}
	}
}

async function invokeFakeSetWhitelist(
	items: string[],
	reason?: string,
): Promise<{ success: boolean; active: boolean; whitelist?: WhitelistItem[]; message?: string; logs: AccessControlLogItem[] }> {
	const raw = await sendToFirewallTool({ action: "set", whitelist: items }, FW_TEST_PIPE_NAME);
	const success = raw.success;
	const errorMessage = raw.success ? undefined : raw.message;
	const active = raw.success ? raw.active : mockActive;
	let whitelist: WhitelistItem[] | undefined = raw.success && raw.whitelist ? raw.whitelist : undefined;

	if (success && whitelist === undefined) {
		const getRes = await sendToFirewallTool({ action: "get" }, FW_TEST_PIPE_NAME);
		if (isValidFirewallMessage(getRes) && getRes.success && getRes.whitelist) {
			whitelist = getRes.whitelist;
		}
	}

	const id = ++logIdCounter;
	const performedAt = Date.now();
	const logItems: AccessControlLogItem[] = (success ? items : [undefined]).map((ip) => ({
		id,
		target: "whitelist",
		action: "add",
		reason: reason || "화이트리스트 설정 갱신",
		success,
		errorMessage: errorMessage ?? null,
		performedAt,
		ip,
	}));

	mockAccessControlLogs.unshift(...logItems);
	return {
		success,
		active,
		whitelist,
		message: errorMessage,
		logs: logItems,
	};
}

// 프론트엔드 스토어(useAccessControlStore 등)가 테스트 환경에서도 동작하도록 window.electronAPI 연결
const globalWithWindow = globalThis as unknown as { window?: Window & typeof globalThis };
if (!globalWithWindow.window) {
	globalWithWindow.window = globalThis as unknown as Window & typeof globalThis;
}
globalWithWindow.window.electronAPI = {
	onLanguageChanged: () => () => {},
	setLanguage: async () => {},
	getLanguage: async () => "ko",
	onSecurityLogsUpdated: () => () => {},
	getEngineStatus: async () => ({
		lastEngineStatus: undefined,
		hasUnreadThreats: false,
		recentSecurityLogs: [],
		dailyStats: [],
		totalCounts: {
			threat: 0,
			recovery: 0,
			telemetry: 0,
			blockedProcesses: 0,
			accessControlLogs: 0,
		},
	}),
	getSecurityLogs: async () => [],
	getSecurityLogsAround: async () => ({ logs: [], hasMoreTop: false, hasMoreBottom: false, topOffset: 0 }),
	acknowledgeThreats: async () => true,
	getAccessControlLogs: async () => [...mockAccessControlLogs],
	getAccessControlLogsAround: async () => ({ logs: [...mockAccessControlLogs], hasMoreTop: false, hasMoreBottom: false, topOffset: 0 }),

	getFirewallStatus: async () => {
		const raw = await sendToFirewallTool({ action: "get" }, FW_TEST_PIPE_NAME);
		return isValidFirewallMessage(raw) ? raw : { success: false, message: "Invalid response" };
	},
	setWhitelist: (items, reason) => invokeFakeSetWhitelist(items, reason),
	refreshWhitelist: async () => {
		const raw = await sendToFirewallTool({ action: "refresh" }, FW_TEST_PIPE_NAME);
		return isValidFirewallMessage(raw) ? raw : { success: false, message: "Invalid response" };
	},
};

let fwServer: net.Server | null = null;
let initPromise: Promise<void> | null = null;

export function ensureTestPipeServers(): Promise<void> {
	if (initPromise) return initPromise;

	initPromise = (async () => {
		if (process.platform !== "win32") {
			for (const sockPath of [FW_TEST_PIPE_NAME, IPC_TEST_PIPE_NAME]) {
				if (fs.existsSync(sockPath)) {
					try {
						fs.unlinkSync(sockPath);
					} catch {
						// ignore
					}
				}
			}
		}

		// 1. 테스트용 IPC 수신기 서버 시작 (IPC_TEST_PIPE_NAME)
		externalIPCReceiver.startListening(IPC_TEST_PIPE_NAME);
		externalIPCReceiver.startConsumer((batch) => {
			const validMessages: IncomingIPCMessage[] = [];
			for (const item of batch) {
				if (isValidIPCMessage(item)) {
					validMessages.push(item);
				}
			}

			if (validMessages.length > 0) {
				useStatusStore.getState().updateStatus(validMessages);
				useMetricStore.getState().addMetrics(validMessages);
				useAlertStore.getState().addAlerts(validMessages);
				useTelemetryStore.getState().addEvents(validMessages);
				tray.notifyImportantEvents(validMessages);
			}
		}, 50);

		// 2. 테스트용 가짜 FirewallTool 파이프 서버 시작 (FW_TEST_PIPE_NAME)
		fwServer = net.createServer((socket) => {
			let buffer = "";

			socket.on("data", (chunk) => {
				buffer += chunk.toString("utf-8");

				const newlineIdx = buffer.indexOf("\n");
				if (newlineIdx !== -1) {
					const line = buffer.slice(0, newlineIdx).trim();
					buffer = buffer.slice(newlineIdx + 1);

					try {
						const req = JSON.parse(line) as FirewallRequest;
						const res = handleFakeFirewallRequest(req);
						socket.write(`${JSON.stringify(res)}\n`);
					} catch (err) {
						const errorRes: IncomingFWMessage = {
							success: false,
							message: err instanceof Error ? err.message : "요청 JSON 파싱 실패",
						};
						socket.write(`${JSON.stringify(errorRes)}\n`);
					}
				}
			});
		});

		await new Promise<void>((resolve, reject) => {
			fwServer!.once("error", reject);
			fwServer!.listen(FW_TEST_PIPE_NAME, () => resolve());
		});
	})();

	return initPromise;
}

export async function stopTestPipeServers(): Promise<void> {
	externalIPCReceiver.stopAll();

	if (fwServer) {
		await new Promise<void>((resolve) => {
			fwServer!.close(() => resolve());
		});
		fwServer = null;
	}

	if (process.platform !== "win32") {
		for (const sockPath of [FW_TEST_PIPE_NAME, IPC_TEST_PIPE_NAME]) {
			try {
				if (fs.existsSync(sockPath)) {
					fs.unlinkSync(sockPath);
				}
			} catch {
				// ignore
			}
		}
	}
	initPromise = null;
}

beforeAll(async () => {
	await ensureTestPipeServers();
});

afterAll(async () => {
	await stopTestPipeServers();
});
