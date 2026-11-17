import { test, expect } from "bun:test";

import { isValidIPCMessage } from "~/services/ipc-receiver";
import { isValidFirewallMessage } from "~/services/firewall-tool";
import { sendMessagesToPipe } from "#/mock-ipc-sender";
import { useStatusStore, useTelemetryStore } from "@/store";

import fixture from "./fixtures/vm-contract.json";
import { IPC_TEST_PIPE_NAME } from "./common";
import { ensureTestPipeServers } from "./preload";

test("captured real VM kernel and firewall messages satisfy dashboard contracts", async () => {
	await ensureTestPipeServers();
	expect(isValidFirewallMessage(fixture.firewall)).toBe(true);
	const messages: IncomingIPCMessage[] = [];
	for (const message of fixture.messages) {
		expect(isValidIPCMessage(message)).toBe(true);
		if (isValidIPCMessage(message)) messages.push(message);
	}
	await sendMessagesToPipe(messages, IPC_TEST_PIPE_NAME);
	const status = messages.find(message => message.type === "SYSTEM_STATUS");
	if (!status) throw new Error("VM fixture is missing SYSTEM_STATUS");
	for (let attempt = 0; attempt < 40; attempt++) {
		if (useStatusStore.getState().lastUpdated === status?.timestamp) break;
		await new Promise(resolve => setTimeout(resolve, 25));
	}
	expect(useStatusStore.getState().data).toEqual(status.data);
	for (const message of messages.filter(message => message.type !== "SYSTEM_STATUS")) {
		expect(useTelemetryStore.getState().events.some(event =>
			event.type === message.type && event.sequenceNumber === message.sequenceNumber,
		)).toBe(true);
	}
});
