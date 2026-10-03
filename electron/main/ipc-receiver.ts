import { externalIPCReceiver } from "../services/ipc-receiver";



export function registerExternalIpcHandlers() {
	externalIPCReceiver.startListening();
	externalIPCReceiver.startConsumer(batch => {
		const items = batch.map(handleBatchItem);
		console.info("[IPC] Processed batch of items:", items);
	});
}



function handleBatchItem(item: unknown) {
	return item;
}
