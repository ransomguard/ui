import net from "node:net";
import { test, expect } from "bun:test";
import { ExternalIPCReceiver } from "~/services/ipc-receiver";

test("durable envelope ACK follows consumer commit and excludes uncommitted IDs", async () => {
	const receiver = new ExternalIPCReceiver();
	const pipe = `\\\\.\\pipe\\Ransom0_ACK_Test_${process.pid}`;
	let release!: () => void;
	const commit = new Promise<void>(resolve => { release = resolve; });
	receiver.startListening(pipe);
	receiver.startConsumer(async (messages, ids) => {
		expect(messages).toEqual([{ value: "한글" }, { value: "rejected" }]);
		expect(ids).toEqual(["committed", "uncommitted"]);
		await commit;
		return ["committed"];
	}, 5);
	const socket = net.createConnection(pipe);
	try {
		await new Promise<void>((resolve, reject) => { socket.once("connect", resolve); socket.once("error", reject); });
		let response = "";
		socket.setEncoding("utf8"); socket.on("data", data => { response += data; });
		socket.write(JSON.stringify({ deliveryVersion: 1, items: [{ id: "committed", message: { value: "한글" } }, { id: "uncommitted", message: { value: "rejected" } }] }) + "\n");
		await new Promise(resolve => setTimeout(resolve, 50));
		expect(response).toBe("");
		release();
		for (let i = 0; i < 40 && !response.includes("\n"); i++) await new Promise(resolve => setTimeout(resolve, 10));
		expect(JSON.parse(response)).toEqual({ deliveryVersion: 1, ack: ["committed"] });
	} finally { release(); socket.destroy(); receiver.stopAll(); }
});
