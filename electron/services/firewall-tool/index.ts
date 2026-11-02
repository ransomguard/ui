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

		client.on("connect", () => {
			const payloadString = `${JSON.stringify(request)}\n`;
			client.write(payloadString);
		});

		client.on("data", (data) => {
			try {
				const response = JSON.parse(data.toString().trim()) as IncomingFWMessage;
				resolve(response);
			} catch {
				reject(new Error(`응답 파싱 실패: ${data.toString()}`));
			} finally {
				client.end();
			}
		});

		client.on("error", (err) => {
			if ("code" in err && err.code === "ENOENT") {
				reject(new Error("FirewallTool 파이프 서버를 찾을 수 없습니다. (FirewallTool이 실행 중인지 확인하세요)"));
			} else {
				reject(err);
			}
		});

		client.on("timeout", () => {
			client.destroy();
			reject(new Error("FirewallTool 응답 시간 초과"));
		});
	});
}
