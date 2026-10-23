import net from "node:net";
import { describe, test, expect } from "bun:test";

import {
	isValidIPCMessage,
	type IncomingIPCMessage,
} from "~/services/ipc-receiver";
import {
	useStatusStore,
	useMetricStore,
	useAlertStore,
	useTelemetryStore,
} from "@/store";

import { IPC_TEST_PIPE_NAME } from "./common";
import {
	ensureTestPipeServers,
	receivedIpcMessages,
	receivedTrayNotifications,
} from "./preload";



const DAY_MS = 24 * 60 * 60 * 1000;

function createMockEngineMessages(now = Date.now()): IncomingIPCMessage[] {
	let seq = 1000;
	const nextSeq = () => ++seq;

	// 대시보드 차트(최근 90일/60일/30일/15일/7일/1일) 추이 확인용 과거 일자별 이벤트
	const historicalDaysAgo = [60, 45, 30, 20, 14, 10, 6, 4, 2, 1];
	const historicalMessages: IncomingIPCMessage[] = historicalDaysAgo.flatMap((daysAgo, idx) => {
		const ts = now - daysAgo * DAY_MS;
		return [
			{
				type: "SYSTEM_STATUS",
				timestamp: ts,
				sequenceNumber: nextSeq(),
				data: {
					engineProcessId: 4120,
					engineVersion: "0.5.0-kernel",
					fastPathMode: 2,
					selfProtectEnabled: true,
					queueDepth: (idx % 5) + 1,
					eventsGenerated: 15 + idx * 4,
					eventsDropped: 0,
					processesBlocked: (idx % 3) + 1,
					processesTerminated: idx % 2,
				},
			},
			{
				type: "PROCESS_BLOCKED",
				timestamp: ts + 1000,
				sequenceNumber: nextSeq(),
				data: {
					processId: 3000 + idx,
					parentProcessId: 1024,
					creatorProcessId: 1024,
					flags: 1,
					processCreateTime: ts,
					matchedRuleId: 100 + idx,
					imagePath: `C:\\Temp\\suspicious_sample_${daysAgo}d.exe`,
					commandLine: `suspicious_sample_${daysAgo}d.exe --silent`,
				},
			},
			{
				type: "FILE_WRITE",
				timestamp: ts + 2000,
				sequenceNumber: nextSeq(),
				data: {
					processId: 2048 + idx,
					operationType: 1,
					flags: 0,
					filePath: `C:\\Users\\Admin\\Documents\\archive_${daysAgo}d.docx`,
				},
			},
		];
	});

	// 현재 시각 기준 모든 페이지(대시보드, 위협 및 복구 현황, 실시간 이벤트) 렌더링용 이벤트
	const currentMessages: IncomingIPCMessage[] = [
		// 1. 실시간 이벤트 (Telemetry: PROCESS_CREATE, FILE_WRITE, FILE_RENAME, PROCESS_TERMINATE)
		{
			type: "PROCESS_CREATE",
			timestamp: now - 15000,
			sequenceNumber: nextSeq(),
			data: {
				processId: 5120,
				parentProcessId: 1420,
				creatorProcessId: 1420,
				flags: 0,
				processCreateTime: now - 15000,
				matchedRuleId: 0,
				imagePath: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
				commandLine: "powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\\Scripts\\backup_check.ps1",
			},
		},
		{
			type: "FILE_WRITE",
			timestamp: now - 12000,
			sequenceNumber: nextSeq(),
			data: {
				processId: 5120,
				operationType: 1,
				flags: 0,
				filePath: "C:\\Users\\Admin\\Documents\\Q4_Financial_Report.xlsx",
			},
		},
		{
			type: "FILE_RENAME",
			timestamp: now - 9000,
			sequenceNumber: nextSeq(),
			data: {
				processId: 6840,
				operationType: 2,
				flags: 1,
				filePath: "C:\\Users\\Admin\\Documents\\Q4_Financial_Report.xlsx",
				newExtension: ".lockbit",
			},
		},

		// 2. 위협 탐지 및 차단 (Alerts & Dashboard Threat 탭: PROCESS_BLOCKED, VSS_ATTEMPT, ALERT)
		{
			type: "PROCESS_BLOCKED",
			timestamp: now - 7500,
			sequenceNumber: nextSeq(),
			data: {
				processId: 6840,
				parentProcessId: 5120,
				creatorProcessId: 5120,
				flags: 2,
				processCreateTime: now - 8000,
				matchedRuleId: 204,
				imagePath: "C:\\Users\\Admin\\AppData\\Local\\Temp\\lockbit_payload.exe",
				commandLine: "lockbit_payload.exe --fast-encrypt C:\\Users\\Admin\\Documents",
			},
		},
		{
			type: "VSS_ATTEMPT",
			timestamp: now - 6000,
			sequenceNumber: nextSeq(),
			data: {
				processId: 6840,
				action: "vssadmin.exe delete shadows /all /quiet",
			},
		},
		{
			type: "ALERT",
			timestamp: now - 5000,
			sequenceNumber: null,
			data: {
				processId: 6840,
				processName: "lockbit_payload.exe",
				action: "BLOCKED",
				eventId: "EVT-2026-9001",
				threatScore: 96,
				ruleName: "Ransom.Behavior.MassEncryptionAndShadowDelete",
				filePath: "C:\\Users\\Admin\\Documents\\Q4_Financial_Report.xlsx.lockbit",
			},
		},
		{
			type: "ALERT",
			timestamp: now - 4000,
			sequenceNumber: null,
			data: {
				processId: 7104,
				processName: "dropper_agent.exe",
				action: "QUARANTINED",
				eventId: "EVT-2026-9002",
				threatScore: 82,
				ruleName: "Heuristic.SuspiciousProcessInjection",
				filePath: "C:\\Users\\Admin\\AppData\\Roaming\\dropper_agent.exe",
			},
		},
		{
			type: "PROCESS_TERMINATE",
			timestamp: now - 3500,
			sequenceNumber: nextSeq(),
			data: {
				processId: 6840,
				parentProcessId: 5120,
				creatorProcessId: 5120,
				flags: 0,
				processCreateTime: now - 8000,
				imagePath: "C:\\Users\\Admin\\AppData\\Local\\Temp\\lockbit_payload.exe",
				commandLine: "lockbit_payload.exe --fast-encrypt C:\\Users\\Admin\\Documents",
			},
		},

		// 3. 백업 및 복구 (Alerts & Dashboard Recovery 탭: VSS_STATUS)
		{
			type: "VSS_STATUS",
			timestamp: now - 3000,
			sequenceNumber: null,
			data: {
				action: "BACKUP_CREATED",
				targetPath: "C:\\Users\\Admin\\Documents",
				message: "보호 대상 폴더의 실시간 VSS 스냅샷 백업이 생성되었습니다.",
				snapshotId: "VSS-SNAP-20261018-01",
			},
		},
		{
			type: "VSS_STATUS",
			timestamp: now - 2000,
			sequenceNumber: null,
			data: {
				action: "RESTORE_STARTED",
				targetPath: "C:\\Users\\Admin\\Documents\\Q4_Financial_Report.xlsx",
				message: "랜섬웨어 훼손 감지 파일에 대한 자동 복구를 시작합니다.",
				snapshotId: "VSS-SNAP-20261018-01",
			},
		},
		{
			type: "VSS_STATUS",
			timestamp: now - 1000,
			sequenceNumber: null,
			data: {
				action: "RESTORE_COMPLETED",
				targetPath: "C:\\Users\\Admin\\Documents\\Q4_Financial_Report.xlsx",
				message: "VSS 스냅샷으로부터 원본 파일 무결성 복구가 완료되었습니다.",
				snapshotId: "VSS-SNAP-20261018-01",
			},
		},

		// 4. 엔진 상태 및 상단 통계 배너 (Dashboard EngineStatus & StatsSection: SYSTEM_STATUS)
		{
			type: "SYSTEM_STATUS",
			timestamp: now,
			sequenceNumber: nextSeq(),
			data: {
				engineProcessId: 4120,
				engineVersion: "0.5.0-kernel",
				fastPathMode: 2,
				selfProtectEnabled: true,
				queueDepth: 8,
				eventsGenerated: 1482,
				eventsDropped: 2,
				processesBlocked: 14,
				processesTerminated: 6,
			},
		},
	];

	return [...historicalMessages, ...currentMessages];
}

function sendMessagesToTestPipe(messages: IncomingIPCMessage[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const client = net.createConnection(IPC_TEST_PIPE_NAME);

		client.on("connect", () => {
			const payload = messages.map((msg) => JSON.stringify(msg)).join("\n") + "\n";
			client.write(payload, (err) => {
				if (err) {
					client.destroy();
					reject(err);
					return;
				}
				client.end();
			});
		});

		client.on("close", () => {
			resolve();
		});

		client.on("error", (err) => {
			reject(err);
		});
	});
}

describe("External IPC Receiver (IPC_TEST_PIPE_NAME)", () => {
	test("외부 엔진 데이터를 테스트 파이프(IPC_TEST_PIPE_NAME)로 전송하고 모든 페이지 스토어 상태 반영 검증", async () => {
		await ensureTestPipeServers();

		const messages = createMockEngineMessages();
		for (const msg of messages) {
			expect(isValidIPCMessage(msg)).toBe(true);
		}

		await sendMessagesToTestPipe(messages);

		// preload의 consumer 인터벌(50ms)에서 배치를 모두 소비할 때까지 대기
		await new Promise((r) => setTimeout(r, 200));

		expect(receivedIpcMessages.length).toBe(messages.length);

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
	});

	test("엔진으로부터 IPC 파이프(IPC_TEST_PIPE_NAME)로 데이터 수신 시 중요 이벤트만 트레이 알림이 발생하는지 검증", async () => {
		await ensureTestPipeServers();
		receivedTrayNotifications.length = 0;

		const now = Date.now();

		// 1. 일반 이벤트(PROCESS_CREATE, FILE_WRITE, SYSTEM_STATUS, BACKUP_CREATED 등)만 전송 시 알림 미발생 검증
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

		expect(receivedTrayNotifications.length).toBe(0);

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

		expect(receivedTrayNotifications.length).toBe(1);
		expect(receivedTrayNotifications[0]?.iconType).toBe("error");
		expect(receivedTrayNotifications[0]?.content).toContain("ransom_cryptor.exe");
		expect(receivedTrayNotifications[0]?.content).toContain("9120");

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

		expect(receivedTrayNotifications.length).toBe(2);
		expect(receivedTrayNotifications[1]?.iconType).toBe("error");
		expect(receivedTrayNotifications[1]?.count).toBe(2);
		expect(receivedTrayNotifications[1]?.content).toContain("blackcat_payload.exe");
		expect(receivedTrayNotifications[1]?.content).toContain("Ransom.BlackCat.Encryption");
	});
});
