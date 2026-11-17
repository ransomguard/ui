import net from "node:net";

import { getPipeName } from "~/config";

import type { FirewallRequest, IncomingFWMessage } from "./types";

export * from "./types";
export { isValidFirewallMessage } from "./guard";



export const PIPE_NAME = getPipeName("Ransom0_Firewall");



export function sendToFirewallTool(
	request: FirewallRequest,
	pipeName = PIPE_NAME,
): Promise<IncomingFWMessage> {
	return new Promise((resolve, reject) => {
		const client = net.createConnection(pipeName);
		client.setTimeout(3000);
		client.setEncoding("utf8");
		let buffer = "";
		let settled = false;
		const fail = (error: Error) => {
			if (settled) return;
			settled = true;
			client.destroy();
			reject(error);
		};
		const finish = (line: string) => {
			if (settled) return;
			try {
				const response = JSON.parse(line.trim()) as IncomingFWMessage;
				settled = true;
				client.destroy();
				resolve(response);
			} catch {
				fail(new Error("응답 파싱 실패"));
			}
		};

		client.on("connect", () => {
			const payloadString = `${JSON.stringify(request)}\n`;
			client.write(payloadString);
		});

		client.on("data", (data) => {
			buffer += data;
			if (Buffer.byteLength(buffer, "utf8") > 1024 * 1024) {
				fail(new Error("FirewallTool 응답 크기 초과"));
				return;
			}
			const newline = buffer.indexOf("\n");
			if (newline !== -1) finish(buffer.slice(0, newline));
		});

		// Also accept the daemon's close-delimited single JSON response.
		client.on("end", () => {
			if (buffer.trim()) finish(buffer);
			else fail(new Error("FirewallTool 응답 없이 연결 종료"));
		});
		client.on("close", () => fail(new Error("FirewallTool 응답 완료 전 연결 종료")));

		client.on("error", (err) => {
			if ("code" in err && err.code === "ENOENT") {
				fail(new Error("FirewallTool 파이프 서버를 찾을 수 없습니다. (FirewallTool이 실행 중인지 확인하세요)"));
			} else {
				fail(err);
			}
		});

		client.on("timeout", () => {
			fail(new Error("FirewallTool 응답 시간 초과"));
		});
	});
}
