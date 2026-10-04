import {
	isObject,
	isBoolean,
	isNumber,
	isString,
	maybeNumber,
	maybeString,
} from "~/utils/guard";

import {
	engineEventTypes,
	alertActions,
	vssActions,
} from "./types";
import type {
	EngineEventType,
	AlertAction,
	VssAction,
	IncomingIPCMessage,
} from "./types";



const setEvents = new Set<EngineEventType>(engineEventTypes);
const setAlertActions = new Set<AlertAction>(alertActions);
const setVssAction = new Set<VssAction>(vssActions);



const isEventType = (value: unknown): value is EngineEventType => (
	typeof value === "string" && setEvents.has(value as EngineEventType)
);

const isAlertActions = (value: unknown): value is AlertAction => (
	typeof value === "string" && setAlertActions.has(value as AlertAction)
);

const isVssAction = (value: unknown): value is VssAction => (
	typeof value === "string" && setVssAction.has(value as VssAction)
);



export function isValidIPCMessage(raw: unknown): raw is IncomingIPCMessage {
	if (!isObject(raw)) return false;

	const { type, timestamp, sequenceNumber, data } = raw;
	if (!isEventType(type)) return false;
	if (!isNumber(timestamp)) return false;
	if (!isObject(data)) return false;

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
				&& isString(data.engineVersion)
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
