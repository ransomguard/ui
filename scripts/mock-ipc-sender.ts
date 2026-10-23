import net from "node:net";

import {
	PIPE_NAME,
	isValidIPCMessage,
	type IncomingIPCMessage,
	type EngineEventType,
} from "~/services/ipc-receiver";



const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 모든 화면(대시보드, 위협 및 복구 현황, 실시간 이벤트, 접근 및 예외 관리 - 프로세스 차단)을
 * 한 번에 확인할 수 있는 초기 시드용 가짜 엔진 IPC 메시지 목록을 생성합니다.
 */
export function createMockEngineMessages(now = Date.now()): IncomingIPCMessage[] {
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

	// 현재 시각 기준 모든 페이지 렌더링용 이벤트
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

		// 2. 위협 탐지 및 차단 (Alerts, Dashboard Threat 탭, 접근 제어 프로세스 차단 탭: PROCESS_BLOCKED, VSS_ATTEMPT, ALERT)
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

/**
 * 지정된 Named Pipe / Unix Domain Socket으로 IPC 메시지 배열을 전송합니다.
 */
export function sendMessagesToPipe(
	messages: IncomingIPCMessage[],
	pipeName = PIPE_NAME,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const client = net.createConnection(pipeName);

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

function createLiveTickMessages(tick: number, now = Date.now()): IncomingIPCMessage[] {
	const baseSeq = 5000 + tick * 10;
	const pid = 7200 + (tick % 50) * 4;
	const messages: IncomingIPCMessage[] = [
		{
			type: "PROCESS_CREATE",
			timestamp: now,
			sequenceNumber: baseSeq + 1,
			data: {
				processId: pid,
				parentProcessId: 1420,
				creatorProcessId: 1420,
				flags: 0,
				processCreateTime: now,
				imagePath: "C:\\Windows\\System32\\svchost.exe",
				commandLine: "svchost.exe -k netsvcs -p",
			},
		},
		{
			type: "FILE_WRITE",
			timestamp: now + 50,
			sequenceNumber: baseSeq + 2,
			data: {
				processId: pid,
				operationType: 1,
				flags: 0,
				filePath: `C:\\Users\\Admin\\Documents\\work_log_${tick}.txt`,
			},
		},
	];

	// 3회마다 위협 차단 및 복구 이벤트도 함께 발생시켜 실시간 알림/차단 목록 갱신 확인
	if (tick % 3 === 0) {
		const threatPid = 9000 + tick;
		messages.push(
			{
				type: "PROCESS_BLOCKED",
				timestamp: now + 100,
				sequenceNumber: baseSeq + 3,
				data: {
					processId: threatPid,
					parentProcessId: pid,
					creatorProcessId: pid,
					flags: 2,
					processCreateTime: now + 80,
					matchedRuleId: 300 + (tick % 20),
					imagePath: `C:\\Users\\Admin\\AppData\\Local\\Temp\\ransom_sim_${tick}.exe`,
					commandLine: `ransom_sim_${tick}.exe --encrypt C:\\Users\\Admin\\Documents`,
				},
			},
			{
				type: "ALERT",
				timestamp: now + 150,
				sequenceNumber: null,
				data: {
					processId: threatPid,
					processName: `ransom_sim_${tick}.exe`,
					action: "BLOCKED",
					eventId: `EVT-LIVE-${tick}`,
					threatScore: 94,
					ruleName: "Ransom.Behavior.LiveSimulation",
					filePath: `C:\\Users\\Admin\\Documents\\work_log_${tick}.txt`,
				},
			},
			{
				type: "VSS_STATUS",
				timestamp: now + 200,
				sequenceNumber: null,
				data: {
					action: "RESTORE_COMPLETED",
					targetPath: `C:\\Users\\Admin\\Documents\\work_log_${tick}.txt`,
					message: "실시간 시뮬레이션 훼손 파일 자동 복구 완료",
					snapshotId: `VSS-SNAP-LIVE-${tick}`,
				},
			},
		);
	}

	messages.push({
		type: "SYSTEM_STATUS",
		timestamp: now + 250,
		sequenceNumber: baseSeq + 9,
		data: {
			engineProcessId: 4120,
			engineVersion: "0.5.0-kernel",
			fastPathMode: 2,
			selfProtectEnabled: true,
			queueDepth: (tick % 9) + 1,
			eventsGenerated: 1482 + tick * 5,
			eventsDropped: 2,
			processesBlocked: 14 + Math.floor(tick / 3),
			processesTerminated: 6 + Math.floor(tick / 3),
		},
	});

	return messages;
}

function summarizeByType(messages: IncomingIPCMessage[]): Record<EngineEventType, number> {
	const counts = {} as Record<EngineEventType, number>;
	for (const msg of messages) {
		counts[msg.type] = (counts[msg.type] ?? 0) + 1;
	}
	return counts;
}

async function runCli() {
	const args = process.argv.slice(2);
	const isStreamMode = args.includes("--stream") || args.includes("-s");
	const intervalArg = args.find((arg) => arg.startsWith("--interval="));
	const intervalMs = intervalArg ? Math.max(500, Number(intervalArg.split("=")[1]) || 3000) : 3000;

	const initialMessages = createMockEngineMessages();
	for (const msg of initialMessages) {
		if (!isValidIPCMessage(msg)) {
			throw new Error(`Invalid mock IPC message generated: ${JSON.stringify(msg)}`);
		}
	}

	console.log(`[Mock IPC Sender] Target Pipe: ${PIPE_NAME}`);
	console.log(`[Mock IPC Sender] Sending ${initialMessages.length} initial mock messages...`);

	try {
		await sendMessagesToPipe(initialMessages, PIPE_NAME);
		console.log("[Mock IPC Sender] Initial batch sent successfully!");
		console.table(summarizeByType(initialMessages));
	} catch (error) {
		console.error(
			`\n[Mock IPC Sender] Failed to connect to ${PIPE_NAME}.\n` +
			"먼저 개발 서버(bun run dev)를 실행하여 Electron 앱이 파이프를 열고 있는지 확인해주세요.\n",
			error,
		);
		process.exit(1);
	}

	if (!isStreamMode) {
		console.log("[Mock IPC Sender] Tip: 실시간 스트리밍 전송을 원하시면 '--stream' (또는 '-s') 옵션을 붙여 실행하세요.");
		return;
	}

	console.log(`[Mock IPC Sender] Stream mode enabled (interval: ${intervalMs}ms). Press Ctrl+C to stop.`);
	let tick = 1;
	setInterval(async () => {
		const liveMessages = createLiveTickMessages(tick++);
		try {
			await sendMessagesToPipe(liveMessages, PIPE_NAME);
			const types = liveMessages.map((m) => m.type).join(", ");
			console.log(`[Mock IPC Sender] Sent tick #${tick - 1} (${liveMessages.length} msgs: ${types})`);
		} catch (error) {
			console.error("[Mock IPC Sender] Stream send failed:", error);
		}
	}, intervalMs);
}

if (import.meta.main) {
	runCli();
}

