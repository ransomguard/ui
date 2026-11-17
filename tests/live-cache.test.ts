import { test, expect } from "bun:test";
import { useTelemetryStore } from "../src/store/use-telemetry-store";
import { useAlertStore } from "../src/store/use-alert-store";
import { useMetricStore } from "../src/store/use-metrics-store";
import { LIVE_CACHE_LIMIT, METRIC_CACHE_LIMIT, trimLiveCache } from "../src/store/live-cache";
import type { IncomingIPCMessage } from "../electron/services/ipc-receiver";

const event = (i: number) => ({ type: "PROCESS_TERMINATE", timestamp: 1800000000000 + i,
	sequenceNumber: i, data: { processId: i } }) as IncomingIPCMessage;

test("120,000 live events bound renderer history but preserve aggregate counts", () => {
	useTelemetryStore.setState({ events: [], hasMore: false, hasMoreBottom: false, hasMoreTop: false });
	useMetricStore.getState().initMetrics([]);
	for (let i = 0; i < 120000; i += 64) {
		const batch = Array.from({ length: Math.min(64, 120000 - i) }, (_, n) => event(i + n));
		useTelemetryStore.getState().addLiveEvents(batch);
		useMetricStore.getState().addMetrics(batch);
	}
	const state = useTelemetryStore.getState();
	expect(state.events.length).toBe(LIVE_CACHE_LIMIT);
	expect(state.events[0]!.sequenceNumber).toBe(119999);
	expect(state.hasMoreBottom).toBe(true);
	expect(useMetricStore.getState().totalCounts.telemetry).toBe(120000);
	expect(useMetricStore.getState().totalCounts.threat).toBe(0);
});

test("evicted history remains loadable and explicitly requested pages survive live traffic", async () => {
	useTelemetryStore.setState({ events: Array.from({ length: 1000 }, (_, i) => event(1000 - i)) as never[], hasMoreBottom: true, hasMoreTop: false });
	let requested: unknown;
	const previous = globalThis.window;
	globalThis.window = { electronAPI: { getSecurityLogs: async (options: unknown) => {
		requested = options;
		return [event(0)];
	} } } as unknown as Window & typeof globalThis;
	try {
		await useTelemetryStore.getState().fetchMoreEventsBottom();
		expect(requested).toMatchObject({ beforeTimestamp: event(1).timestamp, limit: 10 });
		expect(useTelemetryStore.getState().events.at(-1)!.sequenceNumber).toBe(0);
		expect(useTelemetryStore.getState().events.length).toBe(1001);
		useTelemetryStore.setState({ hasMoreTop: true });
		const page = useTelemetryStore.getState().events;
		useTelemetryStore.getState().addLiveEvents([event(1000000)]);
		expect(useTelemetryStore.getState().events).toBe(page);
	} finally { globalThis.window = previous; }
});

test("timestamp pagination never loses half a boundary bucket", () => {
	const items = [5, 4, 3, 3, 2, 1].map(timestamp => ({ timestamp }));
	expect(trimLiveCache(items, 3)).toEqual(items.slice(0, 2));
	const sameTime = Array.from({ length: 20 }, () => ({ timestamp: 1 }));
	expect(trimLiveCache(sameTime, 10)).toBe(sameTime);
	expect(trimLiveCache([{ timestamp: 2 }, ...sameTime], 10)).toEqual([{ timestamp: 2 }]);
});

test("metrics retain daily maxima and verified outcomes beyond the live metric window", () => {
	useMetricStore.getState().initMetrics([]);
	const kill = { type: "ALERT", timestamp: event(0).timestamp, evidence: { mode: "production", source: "response" },
		data: { processId: 4, processGeneration: "133700000000000001", eventId: "cache-kill", action: "BLOCKED", terminationConfirmed: true } } as IncomingIPCMessage;
	useMetricStore.getState().addMetrics([kill]);
	for (let i = 1; i <= 1000; i++) useMetricStore.getState().addMetrics([
		{ type: "SYSTEM_STATUS", timestamp: event(i).timestamp, data: { queueDepth: i === 1 ? 200 : 0, eventsDropped: 51879 } } as IncomingIPCMessage,
	]);
	expect(useMetricStore.getState().metrics.length).toBe(METRIC_CACHE_LIMIT);
	expect(useMetricStore.getState().dailyStats[0]!.queueDepth).toBe(200);
	expect(useMetricStore.getState().dailyStats[0]!.eventsDropped).toBe(51879);
	useMetricStore.getState().addMetrics([kill]);
	expect(useMetricStore.getState().totalCounts.threat).toBe(1);
});

test("alerts bound unsolicited history and retain paging flag", () => {
	useAlertStore.setState({ alerts: [], hasMore: false, hasMoreBottom: false, hasMoreTop: false });
	const logs = Array.from({ length: 2000 }, (_, i) => ({ ...event(i), type: "VSS_STATUS", data: { action: "RESTORE_FAILED" } }) as IncomingIPCMessage);
	useAlertStore.getState().addLiveAlerts(logs);
	expect(useAlertStore.getState().alerts.length).toBe(LIVE_CACHE_LIMIT);
	expect(useAlertStore.getState().hasMoreBottom).toBe(true);
});
