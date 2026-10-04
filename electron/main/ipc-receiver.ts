import { app } from "electron";

import { externalIPCReceiver, isValidIPCMessage } from "~/services/ipc-receiver";

import { getWindow } from "~/main/window";



app.on("before-quit", () => {
	externalIPCReceiver.stopAll();
});

export function registerExternalIpcHandlers() {
	externalIPCReceiver.startListening();
	externalIPCReceiver.startConsumer(batch => {
		const validIMessages: IncomingIPCMessage[] = [];
		const invalidItems: unknown[] = [];
		for (const item of batch) {
			if (isValidIPCMessage(item)) {
				validIMessages.push(item);

				if (item.type === "PROCESS_BLOCKED") {
					// FirewallTool을 앱으로 전환 및 named pipe를 통해 차단 요청
				}
			} else {
				invalidItems.push(item);
			}
		}

		getWindow()?.webContents.send("security-logs-updated", validIMessages);
	});
}
