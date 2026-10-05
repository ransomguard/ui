import os from "node:os";
import net from "node:net";



export * from "./types";
export { isValidFirewallMessage } from "./guard";



const PIPE_NAME = (
	process.platform === "win32"
		? "\\\\.\\pipe\\Ransom0Firewall"
		: `${os.tmpdir()}/Ransom0Firewall.sock`
);



export interface FirewallRequest {
    target: "block" | "whitelist";
    action: "add" | "remove" | "list";
	ips?: string[];
}

export function sendToFirewallTool({
    target,
    action,
    ips = [],
}: FirewallRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const client = net.createConnection(PIPE_NAME);
        client.setTimeout(3000);

        client.on("connect", () => {
            const payloadString = `${JSON.stringify({ target, action, ips })}\n`;
            client.write(payloadString);
        });

        client.on("data", (data) => {
            try {
                // C++ 서버가 보내온 응답 파싱
                const response = JSON.parse(data.toString().trim());
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
