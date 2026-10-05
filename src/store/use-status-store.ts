import { create } from "zustand";



type SystemStatusData = StatusMessage["data"];
export type StatusMessage = ExtractIncomingIPCMessage<"SYSTEM_STATUS">;

export type StatusValue =
	| "THREAT_BLOCKED"   // 위협 차단 알림
	| "OFFLINE"          // 엔진 연결 안됨/끊김
	| "DEGRADED"         // 커널 엔진의 과부하/유실 등
	| "AUDIT_ONLY"       // 탐지 모드인 경우
	| "SECURE";          // 정상

/**
 * 위협 이벤트 타입
 */
const THREAT_TYPES = new Set([
	"PROCESS_BLOCKED",
	"ALERT",
	"VSS_ATTEMPT",
]);



export interface StatusState {
	status: StatusValue | null;
	version: string | null;
	lastUpdated: number | null;
	hasUnreadThreats: boolean | null;
	data: SystemStatusData | null;

	initStatus: (data: GetLastEngineStatusData) => void;
	updateStatus: (logs: IncomingIPCMessage | IncomingIPCMessage[]) => void;

	/**
	 * 위협을 모두 확인했을 때 호출.
	 * 상태를 원래대로 복원
	 */
	clearUnreadThreats: () => void;
}



const toStatusValue = (data: SystemStatusData | null | undefined, hasUnread: boolean | null): StatusValue => (
	hasUnread ? "THREAT_BLOCKED" :
	!data?.engineProcessId ? "OFFLINE" :
	data.eventsDropped > 0 ? "DEGRADED" :
	data.fastPathMode === 1 ? "AUDIT_ONLY" :
	"SECURE"
);



export const useStatusStore = create<StatusState>((set) => ({
	status: null,
	version: null,
	lastUpdated: null,
	hasUnreadThreats: false,
	data: null,

	initStatus: (data) => set((state) => {
		const item = data.lastEngineStatus;
		const newSysData = item?.data ?? state.data;
		const newHasUnread = data.hasUnreadThreats;

		return {
			hasUnreadThreats: newHasUnread,
			data: newSysData,
			status: toStatusValue(newSysData, newHasUnread),
			version: item?.data.engineVersion ?? state.version,
			lastUpdated: item?.timestamp ?? state.lastUpdated,
		};
	}),

	updateStatus: (log) => set((state) => {
		const logs = Array.isArray(log) ? log : [log];

		let newHasUnread = state.hasUnreadThreats;
		let newSysData = state.data;
		let newVersion = state.version;
		let newLastUpdated = state.lastUpdated;

		for (const item of logs) {
			if (THREAT_TYPES.has(item.type)) {
				newHasUnread = true;
			}

			if (item.type === "SYSTEM_STATUS") {
				const sysMsg = item as StatusMessage;
				newSysData = sysMsg.data;
				newVersion = sysMsg.data.engineVersion;
				newLastUpdated = sysMsg.timestamp;
			}
		}

		return {
			hasUnreadThreats: newHasUnread,
			data: newSysData,
			status: toStatusValue(newSysData, newHasUnread),
			version: newVersion,
			lastUpdated: newLastUpdated,
		};
	}),

	clearUnreadThreats: () => set((state) => ({
		hasUnreadThreats: false,
		// 현재 상태 기반으로 다시 계산
		status: toStatusValue(state.data, false), 
	})),
}));
