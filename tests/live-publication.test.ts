import { expect, test } from "bun:test";
import { createLivePublication } from "../electron/services/live-publication";
import { useMetricStore } from "../src/store/use-metrics-store";
import { useTelemetryStore } from "../src/store/use-telemetry-store";
import type { IncomingIPCMessage } from "../electron/services/ipc-receiver";

test("120k publications preserve every ordered item within bounded messages", () => {
	const received: number[] = [];
	let calls = 0;
	const publisher = createLivePublication<{ type: string; id: number }>(items => {
		expect(items.length).toBeLessThanOrEqual(2048);
		calls++;
		received.push(...items.map(x => x.id));
	});
	for (let i = 0; i < 120000; i += 64) publisher.push(Array.from({ length: Math.min(64, 120000 - i) }, (_, j) => ({ type: "FILE_WRITE", id: i + j })));
	publisher.flush();
	expect(received).toEqual(Array.from({ length: 120000 }, (_, i) => i));
	expect(calls).toBe(59);
});

test("alerts and status flush immediately without overtaking ordinary events", () => {
	const received: string[] = [];
	const publisher = createLivePublication(items => received.push(...items.map(x => x.type)));
	publisher.push([{ type: "FILE_WRITE" }]);
	expect(received).toEqual([]);
	publisher.push([{ type: "ALERT" }]);
	expect(received).toEqual(["FILE_WRITE", "ALERT"]);
	publisher.push([{ type: "SYSTEM_STATUS" }]);
	expect(received.at(-1)).toBe("SYSTEM_STATUS");
});

test("low volume flushes on deadline; manual flush cancels duplicate delivery", async () => {
	let count = 0;
	const publisher = createLivePublication(items => { count += items.length; }, { delayMs: 10 });
	publisher.push([{ type: "FILE_RENAME" }]);
	await new Promise(resolve => setTimeout(resolve, 30));
	expect(count).toBe(1);
	publisher.push([{ type: "FILE_WRITE" }]);
	publisher.flush();
	await new Promise(resolve => setTimeout(resolve, 30));
	expect(count).toBe(2);
});

test("coalesced delivery retains all 120k metric counts and newest history", () => {
	useMetricStore.getState().initMetrics([]);
	useTelemetryStore.setState({ events: [], hasMore: false, hasMoreBottom: false, hasMoreTop: false });
	const publisher = createLivePublication<IncomingIPCMessage>(items => {
		useMetricStore.getState().addMetrics(items);
		useTelemetryStore.getState().addLiveEvents(items);
	});
	for (let i = 0; i < 120000; i++) publisher.push([{
		type: "PROCESS_TERMINATE", timestamp: 1800000000000 + i,
		sequenceNumber: i, data: { processId: i },
	} as IncomingIPCMessage]);
	publisher.flush();
	expect(useMetricStore.getState().totalCounts.telemetry).toBe(120000);
	expect(useMetricStore.getState().totalCounts.threat).toBe(0);
	expect(useTelemetryStore.getState().events[0]!.sequenceNumber).toBe(119999);
	expect(useTelemetryStore.getState().hasMoreBottom).toBe(true);
});
