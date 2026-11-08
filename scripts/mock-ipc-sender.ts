import net from "node:net";

import {
	PIPE_NAME,
	isValidIPCMessage,
	type IncomingIPCMessage,
	type EngineEventType,
} from "~/services/ipc-receiver";



const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS_AGO = 90;
const DEFAULT_INITIAL_COUNT = 50;

/**
 * 90일 전부터 현재(now) 사이의 임의 시각(timestamp)을 반환합니다.
 */
function getRandomTimestampWithin90Days(now: number): number {
	const offsetMs = Math.floor(Math.random() * MAX_DAYS_AGO * DAY_MS);
	return now - offsetMs;
}

/**
 * 90일 내 임의 날짜를 가진 단일 랜덤 IPC 메시지를 생성합니다.
 */
function createSingleRandomMockMessage(
	idx: number,
	nextSeq: () => number,
	now: number,
): IncomingIPCMessage {
	const ts = getRandomTimestampWithin90Days(now);
	const approxDaysAgo = Math.max(1, Math.round((now - ts) / DAY_MS));
	const kind = idx % 9;

	switch (kind) {
		case 0:
			return {
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
			};
		case 1:
			return {
				type: "PROCESS_BLOCKED",
				timestamp: ts,
				sequenceNumber: nextSeq(),
				data: {
					processId: 3000 + idx,
					parentProcessId: 1024,
					creatorProcessId: 1024,
					flags: 1,
					processCreateTime: ts - 500,
					matchedRuleId: 100 + (idx % 50),
					imagePath: `C:\\Temp\\suspicious_sample_${approxDaysAgo}d_${idx}.exe`,
					commandLine: `suspicious_sample_${approxDaysAgo}d_${idx}.exe --silent`,
				},
			};
		case 2:
			return {
				type: "FILE_WRITE",
				timestamp: ts,
				sequenceNumber: nextSeq(),
				data: {
					processId: 2048 + idx,
					operationType: 1,
					flags: 0,
					filePath: `C:\\Users\\Admin\\Documents\\archive_${approxDaysAgo}d_${idx}.docx`,
				},
			};
		case 3:
			return {
				type: "PROCESS_CREATE",
				timestamp: ts,
				sequenceNumber: nextSeq(),
				data: {
					processId: 4000 + idx,
					parentProcessId: 1420,
					creatorProcessId: 1420,
					flags: 0,
					processCreateTime: ts,
					matchedRuleId: 0,
					imagePath: "C:\\Windows\\System32\\cmd.exe",
					commandLine: `cmd.exe /c echo check_${idx}`,
				},
			};
		case 4:
			return {
				type: "FILE_RENAME",
				timestamp: ts,
				sequenceNumber: nextSeq(),
				data: {
					processId: 5000 + idx,
					operationType: 2,
					flags: 1,
					filePath: `C:\\Users\\Admin\\Documents\\report_${approxDaysAgo}d_${idx}.xlsx`,
					newExtension: ".encrypted",
				},
			};
		case 5:
			return {
				type: "PROCESS_TERMINATE",
				timestamp: ts,
				sequenceNumber: nextSeq(),
				data: {
					processId: 3000 + idx,
					parentProcessId: 1024,
					creatorProcessId: 1024,
					flags: 0,
					processCreateTime: ts - 3000,
					imagePath: `C:\\Temp\\suspicious_sample_${approxDaysAgo}d_${idx}.exe`,
					commandLine: `suspicious_sample_${approxDaysAgo}d_${idx}.exe --silent`,
				},
			};
		case 6:
			return {
				type: "VSS_ATTEMPT",
				timestamp: ts,
				sequenceNumber: nextSeq(),
				data: {
					processId: 6000 + idx,
					action: "vssadmin.exe delete shadows /all /quiet",
				},
			};
		case 7:
			return {
				type: "ALERT",
				timestamp: ts,
				sequenceNumber: null,
				data: {
					processId: 6000 + idx,
					processName: `malicious_${idx}.exe`,
					action: idx % 2 === 0 ? "BLOCKED" : "QUARANTINED",
					eventId: `EVT-RND-${1000 + idx}`,
					threatScore: 80 + (idx % 20),
					ruleName: "Ransom.Behavior.MassEncryption",
					filePath: `C:\\Users\\Admin\\Documents\\report_${approxDaysAgo}d_${idx}.xlsx`,
				},
			};
		default:
			return {
				type: "VSS_STATUS",
				timestamp: ts,
				sequenceNumber: null,
				data: {
					action: idx % 2 === 0 ? "BACKUP_CREATED" : "RESTORE_COMPLETED",
					targetPath: `C:\\Users\\Admin\\Documents\\report_${approxDaysAgo}d_${idx}.xlsx`,
					message: "VSS 스냅샷 백업 및 무결성 복구 이벤트",
					snapshotId: `VSS-SNAP-RND-${idx}`,
				},
			};
	}
}

/**
 * 모든 화면(대시보드, 위협 및 복구 현황, 실시간 이벤트, 접근 및 예외 관리 - 프로세스 차단)을
 * 한 번에 확인할 수 있는 초기 시드용 가짜 엔진 IPC 메시지 목록을 생성합니다.
 * 초기 배치 데이터는 지정된 개수(count)만큼 90일 전부터 현재까지의 랜덤 날짜로 고르게 분포됩니다.
 */
export function createMockEngineMessages(
	now = Date.now(),
	count = DEFAULT_INITIAL_COUNT,
): IncomingIPCMessage[] {
	if (count <= 0) return [];

	let seq = 1000;
	const nextSeq = () => ++seq;

	// 모든 페이지/탭 렌더링을 보장하는 대표 이벤트들도 오늘 날짜에 몰리지 않도록 90일 내 랜덤 시각 부여
	const tsProcessCreate = getRandomTimestampWithin90Days(now);
	const tsFileWrite = getRandomTimestampWithin90Days(now);
	const tsFileRename = getRandomTimestampWithin90Days(now);
	const tsProcessBlocked = getRandomTimestampWithin90Days(now);
	const tsVssAttempt = getRandomTimestampWithin90Days(now);
	const tsAlertBlocked = getRandomTimestampWithin90Days(now);
	const tsAlertQuarantined = getRandomTimestampWithin90Days(now);
	const tsProcessTerminate = getRandomTimestampWithin90Days(now);
	const tsVssBackup = getRandomTimestampWithin90Days(now);
	const tsVssRestoreStart = Math.min(now, tsVssBackup + 1000);
	const tsVssRestoreDone = Math.min(now, tsVssBackup + 2000);
	const tsFinalStatus = getRandomTimestampWithin90Days(now);

	const representativeMessages: IncomingIPCMessage[] = [
		// 1. 실시간 이벤트 (Telemetry: PROCESS_CREATE, FILE_WRITE, FILE_RENAME, PROCESS_TERMINATE)
		{
			type: "PROCESS_CREATE",
			timestamp: tsProcessCreate,
			sequenceNumber: nextSeq(),
			data: {
				processId: 5120,
				parentProcessId: 1420,
				creatorProcessId: 1420,
				flags: 0,
				processCreateTime: tsProcessCreate,
				matchedRuleId: 0,
				imagePath: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
				commandLine: "powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\\Scripts\\backup_check.ps1",
			},
		},
		{
			type: "FILE_WRITE",
			timestamp: tsFileWrite,
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
			timestamp: tsFileRename,
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
			timestamp: tsProcessBlocked,
			sequenceNumber: nextSeq(),
			data: {
				processId: 6840,
				parentProcessId: 5120,
				creatorProcessId: 5120,
				flags: 2,
				processCreateTime: tsProcessBlocked - 500,
				matchedRuleId: 204,
				imagePath: "C:\\Users\\Admin\\AppData\\Local\\Temp\\lockbit_payload.exe",
				commandLine: "lockbit_payload.exe --fast-encrypt C:\\Users\\Admin\\Documents",
			},
		},
		{
			type: "VSS_ATTEMPT",
			timestamp: tsVssAttempt,
			sequenceNumber: nextSeq(),
			data: {
				processId: 6840,
				action: "vssadmin.exe delete shadows /all /quiet",
			},
		},
		{
			type: "ALERT",
			timestamp: tsAlertBlocked,
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
			timestamp: tsAlertQuarantined,
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
			timestamp: tsProcessTerminate,
			sequenceNumber: nextSeq(),
			data: {
				processId: 6840,
				parentProcessId: 5120,
				creatorProcessId: 5120,
				flags: 0,
				processCreateTime: tsProcessTerminate - 4500,
				imagePath: "C:\\Users\\Admin\\AppData\\Local\\Temp\\lockbit_payload.exe",
				commandLine: "lockbit_payload.exe --fast-encrypt C:\\Users\\Admin\\Documents",
			},
		},

		// 3. 백업 및 복구 (Alerts & Dashboard Recovery 탭: VSS_STATUS)
		{
			type: "VSS_STATUS",
			timestamp: tsVssBackup,
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
			timestamp: tsVssRestoreStart,
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
			timestamp: tsVssRestoreDone,
			sequenceNumber: null,
			data: {
				action: "RESTORE_COMPLETED",
				targetPath: "C:\\Users\\Admin\\Documents\\Q4_Financial_Report.xlsx",
				message: "VSS 스냅샷으로부터 원본 파일 무결성 복구가 완료되었습니다.",
				snapshotId: "VSS-SNAP-20261018-01",
			},
		},
	];

	const finalStatusMessage: IncomingIPCMessage = {
		type: "SYSTEM_STATUS",
		timestamp: tsFinalStatus,
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
	};

	// 요청한 count가 대표 메시지 수(12개)보다 작을 때는 순수 랜덤 메시지로 count개 생성
	if (count < representativeMessages.length + 1) {
		return Array.from({ length: count }, (_, idx) =>
			createSingleRandomMockMessage(idx, nextSeq, now),
		).sort((a, b) => a.timestamp - b.timestamp);
	}

	// 대표 메시지(11개) + 마지막 SYSTEM_STATUS(1개)를 제외한 나머지 개수만큼 랜덤 메시지 생성
	const extraRandomCount = count - (representativeMessages.length + 1);
	const randomMessages: IncomingIPCMessage[] = Array.from(
		{ length: extraRandomCount },
		(_, idx) => createSingleRandomMockMessage(idx, nextSeq, now),
	);

	// 시간순 정렬 후 마지막 엔진 상태(SYSTEM_STATUS) 추가하여 총 count개 반환
	const sortedMessages = [...randomMessages, ...representativeMessages].sort(
		(a, b) => a.timestamp - b.timestamp,
	);
	sortedMessages.push(finalStatusMessage);

	return sortedMessages;
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

function parseNumericOption(
	args: string[],
	flags: string[],
	defaultValue: number,
): number {
	for (let i = 0; i < args.length; i++) {
		const arg = args[i]!;
		for (const flag of flags) {
			if (arg === flag && args[i + 1] !== undefined) {
				const parsed = Number(args[i + 1]);
				if (!Number.isNaN(parsed)) return parsed;
			}
			if (arg.startsWith(`${flag}=`)) {
				const parsed = Number(arg.slice(flag.length + 1));
				if (!Number.isNaN(parsed)) return parsed;
			}
		}
	}
	return defaultValue;
}

async function runCli() {
	const args = process.argv.slice(2);
	const isStreamMode = args.includes("--stream") || args.includes("-s");
	const initialCount = Math.max(
		0,
		Math.floor(parseNumericOption(args, ["--count", "-c"], DEFAULT_INITIAL_COUNT)),
	);
	const intervalMs = Math.max(
		500,
		Math.floor(parseNumericOption(args, ["--interval", "-i"], 3000)),
	);

	console.log(`[Mock IPC Sender] Target Pipe: ${PIPE_NAME}`);

	if (initialCount > 0) {
		const initialMessages = createMockEngineMessages(Date.now(), initialCount);
		for (const msg of initialMessages) {
			if (!isValidIPCMessage(msg)) {
				throw new Error(`Invalid mock IPC message generated: ${JSON.stringify(msg)}`);
			}
		}

		console.log(`[Mock IPC Sender] Sending ${initialMessages.length} initial random mock messages (90d range)...`);

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
	} else {
		console.log("[Mock IPC Sender] Initial count is 0, skipping initial batch.");
	}

	if (!isStreamMode) {
		console.log("[Mock IPC Sender] Tip: 실시간 스트리밍 전송을 원하시면 '--stream' (또는 '-s'), 초기 데이터 개수를 지정하려면 '--count <N>' (또는 '-c <N>') 옵션을 붙여 실행하세요.");
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
