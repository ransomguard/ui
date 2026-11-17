import net from "node:net";
import { test, expect } from "bun:test";

import { sendToFirewallTool } from "~/services/firewall-tool";
import { useTelemetryStore } from "@/store";

import { FW_TEST_PIPE_NAME, IPC_TEST_PIPE_NAME } from "./common";
import { ensureTestPipeServers } from "./preload";

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test("firewall buffers fragmented UTF-8 JSON until newline", async () => {
	const pipe = `${FW_TEST_PIPE_NAME}_FRAGMENT`;
	const response = { success: false, message: "한글 응답", action: "get" } as const;
	const bytes = Buffer.from(`${JSON.stringify(response)}\n`);
	const split = bytes.indexOf(Buffer.from("한")) + 1;
	const server = net.createServer(socket => {
		socket.once("data", () => {
			socket.write(bytes.subarray(0, split));
			setTimeout(() => socket.end(bytes.subarray(split)), 30);
		});
	});
	await new Promise<void>(resolve => server.listen(pipe, resolve));
	try {
		expect(await sendToFirewallTool({ action: "get" }, pipe)).toEqual(response);
	} finally {
		await new Promise<void>(resolve => server.close(() => resolve()));
	}
});

test("firewall rejects empty EOF instead of leaving a pending promise", async () => {
	const pipe = `${FW_TEST_PIPE_NAME}_EMPTY`;
	const server = net.createServer(socket => socket.once("data", () => socket.end()));
	await new Promise<void>(resolve => server.listen(pipe, resolve));
	try {
		await expect(sendToFirewallTool({ action: "get" }, pipe)).rejects.toThrow("응답 없이");
	} finally {
		await new Promise<void>(resolve => server.close(() => resolve()));
	}
});

test("engine pipe preserves Korean paths split inside a UTF-8 character", async () => {
	await ensureTestPipeServers();
	const path = "C:\\검증\\한글파일.txt";
	const message = { type: "FILE_WRITE", timestamp: Date.now(), sequenceNumber: 987654,
		data: { processId: 123, operationType: 1, flags: 16, filePath: path } };
	const bytes = Buffer.from(`${JSON.stringify(message)}\n`);
	const split = bytes.indexOf(Buffer.from("검")) + 1;
	const socket = net.createConnection(IPC_TEST_PIPE_NAME);
	await new Promise<void>((resolve, reject) => {
		socket.once("error", reject);
		socket.once("connect", resolve);
	});
	try {
		socket.write(bytes.subarray(0, split));
		await pause(30);
		socket.end(bytes.subarray(split));
		for (let attempt = 0; attempt < 40; attempt++) {
			if (useTelemetryStore.getState().events.some(event => event.sequenceNumber === 987654)) break;
			await pause(25);
		}
		const received = useTelemetryStore.getState().events.find(event => event.sequenceNumber === 987654);
		expect(received?.data).toEqual(message.data);
	} finally {
		socket.destroy();
	}
});
