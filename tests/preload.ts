import fs from "node:fs";
import net from "node:net";
import { beforeAll, afterAll } from "bun:test";

import {
	externalIPCReceiver,
	isValidIPCMessage,
	type IncomingIPCMessage,
} from "~/services/ipc-receiver";
import {
	sendToFirewallTool,
	isValidFirewallMessage,
	type FirewallRequest,
	type IncomingFWMessage,
} from "~/services/firewall-tool";
import {
	useStatusStore,
	useMetricStore,
	useAlertStore,
	useTelemetryStore,
} from "@/store";

import { FW_TEST_PIPE_NAME, IPC_TEST_PIPE_NAME } from "./common";



// IPC 수신기를 통해 들어온 유효 메시지 기록
export const receivedIpcMessages: IncomingIPCMessage[] = [];

// 가짜 FirewallTool 파이프 서버가 유지할 인메모리 상태
const mockBlockedIps = new Set<string>([
	"185.220.101.42",
	"45.155.205.233",
	"103.145.13.99",
]);

const mockWhitelistIps = new Set<string>([
	"10.0.0.1",
	"192.168.0.10",
]);

const mockAccessControlLogs: AccessControlLogItem[] = [];
let logIdCounter = 0;

function handleFakeFirewallRequest(req: FirewallRequest): IncomingFWMessage {
	const targetSet = req.target === "block" ? mockBlockedIps : mockWhitelistIps;
	const ips = Array.isArray(req.ips) ? req.ips : [];

	switch (req.action) {
		case "list": {
			return {
				success: true,
				message: "OK",
				ips: Array.from(targetSet),
			};
		}
		case "add": {
			if (ips.includes("0.0.0.0")) {
				return {
					success: false,
					message: "예약된 시스템 주소(0.0.0.0)는 방화벽 정책에 추가할 수 없습니다.",
				};
			}
			for (const ip of ips) {
				targetSet.add(ip);
			}
			return {
				success: true,
				message: `${req.target} 목록에 ${ips.length}개 IP가 추가되었습니다.`,
				ips: Array.from(targetSet),
			};
		}
		case "remove": {
			for (const ip of ips) {
				targetSet.delete(ip);
			}
			return {
				success: true,
				message: `${req.target} 목록에서 ${ips.length}개 IP가 제거되었습니다.`,
				ips: Array.from(targetSet),
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

async function invokeFakeFirewallAction(
	target: "block" | "whitelist",
	action: "add" | "remove",
	ips: string[],
	reason: string,
): Promise<AccessControlLogItem[]> {
	let response: IncomingFWMessage;
	try {
		const raw = await sendToFirewallTool({ target, action, ips }, FW_TEST_PIPE_NAME);
		response = isValidFirewallMessage(raw)
			? raw
			: { success: false, message: "Invalid response from firewall tool" };
	} catch (err) {
		response = {
			success: false,
			message: err instanceof Error ? err.message : String(err),
		};
	}

	const id = ++logIdCounter;
	const performedAt = Date.now();
	const items: AccessControlLogItem[] = (response.success ? response.ips : [undefined]).map((ip) => ({
		id,
		target,
		action,
		reason,
		success: response.success,
		errorMessage: response.message,
		performedAt,
		ip,
	}));

	mockAccessControlLogs.unshift(...items);
	return items;
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
	}),
	getAccessControlLogs: async () => [...mockAccessControlLogs],
	getBlockedIPs: async () => {
		const raw = await sendToFirewallTool({ target: "block", action: "list" }, FW_TEST_PIPE_NAME);
		return isValidFirewallMessage(raw) ? raw : { success: false, message: "Invalid response" };
	},
	getWhitelistedIPs: async () => {
		const raw = await sendToFirewallTool({ target: "whitelist", action: "list" }, FW_TEST_PIPE_NAME);
		return isValidFirewallMessage(raw) ? raw : { success: false, message: "Invalid response" };
	},
	addBlockedIPs: (ips, reason) => invokeFakeFirewallAction("block", "add", ips, reason),
	removeBlockedIPs: (ips, reason) => invokeFakeFirewallAction("block", "remove", ips, reason),
	addWhitelistedIPs: (ips, reason) => invokeFakeFirewallAction("whitelist", "add", ips, reason),
	removeWhitelistedIPs: (ips, reason) => invokeFakeFirewallAction("whitelist", "remove", ips, reason),
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
					} catch {}
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
					receivedIpcMessages.push(item);
				}
			}

			if (validMessages.length > 0) {
				useStatusStore.getState().updateStatus(validMessages);
				useMetricStore.getState().addMetrics(validMessages);
				useAlertStore.getState().addAlerts(validMessages);
				useTelemetryStore.getState().addEvents(validMessages);
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
	initPromise = null;
}

beforeAll(async () => {
	await ensureTestPipeServers();
});

afterAll(async () => {
	await stopTestPipeServers();
});
