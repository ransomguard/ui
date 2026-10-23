import { describe, test, expect, spyOn } from "bun:test";

import {
	isValidIPCMessage,
	type IncomingIPCMessage,
} from "~/services/ipc-receiver";
import * as tray from "~/main/tray";
import {
	useStatusStore,
	useMetricStore,
	useAlertStore,
	useTelemetryStore,
} from "@/store";

import {
	createMockEngineMessages,
	sendMessagesToPipe,
} from "../scripts/mock-ipc-sender";
import { IPC_TEST_PIPE_NAME } from "./common";
import { ensureTestPipeServers } from "./preload";



const sendMessagesToTestPipe = (messages: IncomingIPCMessage[]) => (
	sendMessagesToPipe(messages, IPC_TEST_PIPE_NAME)
);

describe("External IPC Receiver (IPC_TEST_PIPE_NAME)", () => {
	test("외부 엔진 데이터를 테스트 파이프(IPC_TEST_PIPE_NAME)로 전송하고 모든 페이지 스토어 상태 반영 검증", async () => {
		await ensureTestPipeServers();

		const updateStatusSpy = spyOn(useStatusStore.getState(), "updateStatus");

		try {
			const messages = createMockEngineMessages();
			for (const msg of messages) {
				expect(isValidIPCMessage(msg)).toBe(true);
			}

			await sendMessagesToTestPipe(messages);

			// preload의 consumer 인터벌(50ms)에서 배치를 모두 소비할 때까지 대기
			await new Promise((r) => setTimeout(r, 200));

			const totalReceived = updateStatusSpy.mock.calls.reduce(
				(sum, [batch]) => sum + (Array.isArray(batch) ? batch.length : 1),
				0,
			);
			expect(totalReceived).toBe(messages.length);

			// 1. 대시보드 엔진 상태 배너 및 4개 통계 카드 상태 검증 (useStatusStore)
			const statusState = useStatusStore.getState();
			expect(statusState.status).toBe("THREAT_BLOCKED");
			expect(statusState.version).toBe("0.5.0-kernel");
			expect(statusState.hasUnreadThreats).toBe(true);
			expect(statusState.data?.processesBlocked).toBe(14);
			expect(statusState.data?.processesTerminated).toBe(6);
			expect(statusState.data?.queueDepth).toBe(8);
			expect(statusState.data?.eventsDropped).toBe(2);

			// 2. 대시보드 메인 추이 차트 데이터 검증 (useMetricStore)
			const metricState = useMetricStore.getState();
			expect(metricState.metrics.length).toBeGreaterThan(0);

			// 3. 위협 및 복구 현황 페이지(/alerts) 및 대시보드 위협/복구 요약 데이터 검증 (useAlertStore)
			const alertState = useAlertStore.getState();
			expect(alertState.alerts.some((a) => a.type === "ALERT" && a.data.action === "BLOCKED")).toBe(true);
			expect(alertState.alerts.some((a) => a.type === "PROCESS_BLOCKED")).toBe(true);
			expect(alertState.alerts.some((a) => a.type === "VSS_ATTEMPT")).toBe(true);
			expect(alertState.alerts.some((a) => a.type === "VSS_STATUS" && a.data.action === "RESTORE_COMPLETED")).toBe(true);

			// 4. 실시간 이벤트 페이지(/telemetry) 및 대시보드 이벤트 요약 데이터 검증 (useTelemetryStore)
			const telemetryState = useTelemetryStore.getState();
			expect(telemetryState.events.some((e) => e.type === "PROCESS_CREATE")).toBe(true);
			expect(telemetryState.events.some((e) => e.type === "FILE_WRITE")).toBe(true);
			expect(telemetryState.events.some((e) => e.type === "FILE_RENAME")).toBe(true);
			expect(telemetryState.events.some((e) => e.type === "PROCESS_TERMINATE")).toBe(true);
		} finally {
			updateStatusSpy.mockRestore();
		}
	});

	test("엔진으로부터 IPC 파이프(IPC_TEST_PIPE_NAME)로 데이터 수신 시 중요 이벤트만 트레이 알림이 발생하는지 검증", async () => {
		await ensureTestPipeServers();

		const notifySpy = spyOn(tray, "notifyImportantEvents");

		try {
			const now = Date.now();

			// 1. 일반 이벤트(PROCESS_CREATE, FILE_WRITE, BACKUP_CREATED, ALLOWED 등)만 전송 시 알림 미발생(null 반환) 검증
			const nonImportantMessages: IncomingIPCMessage[] = [
				{
					type: "PROCESS_CREATE",
					timestamp: now,
					sequenceNumber: 2001,
					data: {
						processId: 8001,
						parentProcessId: 1000,
						creatorProcessId: 1000,
						flags: 0,
						processCreateTime: now,
						imagePath: "C:\\Windows\\System32\\notepad.exe",
						commandLine: "notepad.exe",
					},
				},
				{
					type: "FILE_WRITE",
					timestamp: now + 10,
					sequenceNumber: 2002,
					data: {
						processId: 8001,
						operationType: 1,
						flags: 0,
						filePath: "C:\\Users\\Admin\\Desktop\\memo.txt",
					},
				},
				{
					type: "VSS_STATUS",
					timestamp: now + 20,
					sequenceNumber: null,
					data: {
						action: "BACKUP_CREATED",
						targetPath: "C:\\Users\\Admin\\Documents",
						message: "정기 스냅샷 생성 완료",
						snapshotId: "VSS-SNAP-01",
					},
				},
				{
					type: "ALERT",
					timestamp: now + 30,
					sequenceNumber: null,
					data: {
						processId: 8001,
						processName: "notepad.exe",
						action: "ALLOWED",
						eventId: "EVT-ALLOW-01",
						threatScore: 5,
						ruleName: "Normal.FileWrite",
					},
				},
			];

			await sendMessagesToTestPipe(nonImportantMessages);
			await new Promise((r) => setTimeout(r, 150));

			const notificationsAfterNonImportant = notifySpy.mock.results
				.map((r) => r.value as tray.TrayNotificationPayload | null)
				.filter((v): v is tray.TrayNotificationPayload => v !== null);
			expect(notificationsAfterNonImportant.length).toBe(0);

			// 2. 중요 이벤트(PROCESS_BLOCKED)를 IPC 파이프로 전송 시 트레이 알림 발생 검증
			await sendMessagesToTestPipe([
				{
					type: "PROCESS_BLOCKED",
					timestamp: now + 100,
					sequenceNumber: 2003,
					data: {
						processId: 9120,
						parentProcessId: 4000,
						creatorProcessId: 4000,
						flags: 1,
						processCreateTime: now + 100,
						matchedRuleId: 305,
						imagePath: "C:\\Temp\\ransom_cryptor.exe",
						commandLine: "ransom_cryptor.exe",
					},
				},
			]);
			await new Promise((r) => setTimeout(r, 150));

			const notificationsAfterBlocked = notifySpy.mock.results
				.map((r) => r.value as tray.TrayNotificationPayload | null)
				.filter((v): v is tray.TrayNotificationPayload => v !== null);
			expect(notificationsAfterBlocked.length).toBe(1);
			expect(notificationsAfterBlocked[0]?.iconType).toBe("error");
			expect(notificationsAfterBlocked[0]?.content).toContain("ransom_cryptor.exe");
			expect(notificationsAfterBlocked[0]?.content).toContain("9120");

			// 3. 중요 이벤트(ALERT - BLOCKED 및 VSS_STATUS - RESTORE_COMPLETED) 동시 수신 시 위협 우선 알림 및 추가 건수 합산 검증
			await sendMessagesToTestPipe([
				{
					type: "ALERT",
					timestamp: now + 200,
					sequenceNumber: null,
					data: {
						processId: 9500,
						processName: "blackcat_payload.exe",
						action: "BLOCKED",
						eventId: "EVT-BLOCK-99",
						threatScore: 98,
						ruleName: "Ransom.BlackCat.Encryption",
						filePath: "C:\\Users\\Admin\\Documents\\secret.pdf",
					},
				},
				{
					type: "VSS_STATUS",
					timestamp: now + 210,
					sequenceNumber: null,
					data: {
						action: "RESTORE_COMPLETED",
						targetPath: "C:\\Users\\Admin\\Documents\\secret.pdf",
						message: "원본 파일 자동 복구 완료",
						snapshotId: "VSS-SNAP-02",
					},
				},
			]);
			await new Promise((r) => setTimeout(r, 150));

			const allNotifications = notifySpy.mock.results
				.map((r) => r.value as tray.TrayNotificationPayload | null)
				.filter((v): v is tray.TrayNotificationPayload => v !== null);
			expect(allNotifications.length).toBe(2);
			expect(allNotifications[1]?.iconType).toBe("error");
			expect(allNotifications[1]?.count).toBe(2);
			expect(allNotifications[1]?.content).toContain("blackcat_payload.exe");
			expect(allNotifications[1]?.content).toContain("Ransom.BlackCat.Encryption");
		} finally {
			notifySpy.mockRestore();
		}
	});
});
