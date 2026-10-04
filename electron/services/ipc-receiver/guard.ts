import type {
	EngineEventType,
	AlertAction,
	VssAction,
	IncomingIPCMessage,
} from "./types";



const validTypes = new Set<EngineEventType>([
	"PROCESS_CREATE",
	"PROCESS_TERMINATE",
	"PROCESS_BLOCKED",
	"FILE_WRITE",
	"FILE_RENAME",
	"SYSTEM_STATUS",
	"VSS_ATTEMPT",
	"ALERT",
	"VSS_STATUS",
]);

const alertActions = new Set<AlertAction>([
	"BLOCKED",
	"ALLOWED",
	"QUARANTINED",
]);

const vssStatusAction = new Set<VssAction>([
	"BACKUP_CREATED",
	"RESTORE_STARTED",
	"RESTORE_COMPLETED",
	"RESTORE_FAILED",
]);



const isEventType = (value: unknown): value is EngineEventType => (
	typeof value === "string" && validTypes.has(value as EngineEventType)
);

const isAlertActions = (value: unknown): value is AlertAction => (
	typeof value === "string" && alertActions.has(value as AlertAction)
);

const isVssAction = (value: unknown): value is VssAction => (
	typeof value === "string" && vssStatusAction.has(value as VssAction)
);

const isObject = (value: unknown): value is Record<string, unknown> => (
	value !== null && typeof value === "object"
);

const isNullish = (value: unknown) => (
	typeof value === "undefined" || value === null
);

const isString = (value: unknown) => (
	typeof value === "string"
);

const isNumber = (value: unknown) => (
	typeof value === "number"
);

const isBoolean = (value: unknown) => (
	typeof value === "boolean"
);

const maybeString = (value: unknown) => (
	isNullish(value) || isString(value)
);

const maybeNumber = (value: unknown) => (
	isNullish(value) || isNumber(value)
);



export function isValidIPCMessage(raw: unknown): raw is IncomingIPCMessage {
	if (!isObject(raw)) return false;
	if (!isEventType(raw.type)) return false;
	if (!isNumber(raw.timestamp)) return false;
	if (!isObject(raw.data)) return false;

	const { type, sequenceNumber, data } = raw;
	switch (type) {
		// [커널] 프로세스 관련
		case "PROCESS_CREATE":
		case "PROCESS_TERMINATE":
		case "PROCESS_BLOCKED":
			return (
				isNumber(sequenceNumber)
				&& isNumber(data.processId)
				&& isNumber(data.parentProcessId)
				&& isNumber(data.creatorProcessId)
				&& isNumber(data.flags)
				&& isNumber(data.processCreateTime)
				&& (maybeNumber(data.matchedRuleId))
				&& (maybeString(data.imagePath))
				&& (maybeString(data.commandLine))
			);

		// [커널] 파일 I/O 관련
		case "FILE_WRITE":
		case "FILE_RENAME":
			return (
				isNumber(sequenceNumber)
				&& isNumber(data.processId)
				&& isNumber(data.operationType)
				&& isNumber(data.flags)
				&& (maybeString(data.filePath))
				&& (maybeString(data.newExtension))
			);

		// [커널] 시스템 통계 및 부하 알림
		case "SYSTEM_STATUS":
			return (
				isNumber(sequenceNumber)
				&& isNumber(data.engineProcessId)
				&& isNumber(data.fastPathMode)
				&& isBoolean(data.selfProtectEnabled)
				&& isNumber(data.queueDepth)
				&& isNumber(data.eventsGenerated)
				&& isNumber(data.eventsDropped)
				&& isNumber(data.processesBlocked)
				&& isNumber(data.processesTerminated)
			);

		// [커널] 섀도우 카피 삭제 시도 (위험)
		case "VSS_ATTEMPT":
			return (
				isNumber(sequenceNumber)
				&& isNumber(data.processId)
				&& isString(data.action)
			);

		// [분석] 랜섬웨어 탐지 알람
		case "ALERT":
			return (
				maybeNumber(sequenceNumber)
				&& isNumber(data.processId)
				&& isString(data.processName)
				&& isAlertActions(data.action)
				&& isString(data.eventId)
				&& maybeString(data.filePath)
				&& isNumber(data.threatScore)
				&& isString(data.ruleName)
			);

		// [복구] 파일 복구 상태 알림
		case "VSS_STATUS":
			return (
				maybeNumber(sequenceNumber)
				&& isVssAction(data.action)
				&& maybeString(data.snapshotId)
				&& isString(data.targetPath)
				&& isString(data.message)
			);

		default:
			return false;
	}
}
