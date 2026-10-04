/**
 * 전체 이벤트 타입 통합:
 * - 커널(1~7)
 * - 상관분석/복구(8~9)
 */
export type EngineEventType = 
    | "PROCESS_CREATE"    // 1. [커널] 프로세스 생성
    | "PROCESS_TERMINATE" // 2. [커널] 프로세스 종료
    | "PROCESS_BLOCKED"   // 3. [커널] 프로세스 차단
    | "FILE_WRITE"        // 4. [커널] 파일 쓰기 (I/O)
    | "FILE_RENAME"       // 5. [커널] 확장자 변경
    | "SYSTEM_STATUS"     // 6. [커널] 시스템 건강/통계 상태
    | "VSS_ATTEMPT"       // 7. [커널] 랜섬웨어의 섀도우 카피 삭제 공격 탐지
    | "ALERT"             // 8. [상관분석] 이상 행위 분석 후 최종 탐지/차단 알람
    | "VSS_STATUS";       // 9. [복구] 훼손 파일 복구 및 백업 진행 상태



/**
 * - 모든 IPC 메시지 구조는 아래와 같은 구조를 따름
 * - 데이터 본문 하위 인터페이스들는 항상 이 인터페이스의 data에 포함됨
 * - 자세한 내용은 IncomingIPCMessage 타입 참고
 */
export interface BaseIPCMessage<
	T extends EngineEventType,
	D = unknown,
> {
    type: T;
    timestamp: number;               // ULONG64 (발생 시간)
    sequenceNumber?: number | null;  // 커널은 전송하지만, 분석(Python 등)은 안 보낼 수도 있으므로 옵셔널
    data: D;                         // 실제 상세 데이터는 무조건 이 안에 위치
}

/**
 * sequenceNumber가 필수인 커널용 IPC 메시지 구조.
 * {@link BaseIPCMessage}를 확장
 */
export interface BaseIPCMessageWithSeq<
	T extends EngineEventType,
	D = unknown,
> extends BaseIPCMessage<T, D> {
	sequenceNumber: number;
}

/**
 * - 메시지 타입과 데이터 구조 매핑
 * - 예를 들어, 메시지 타입이(type) PROCESS_CREATE인 경우, 데이터(data) 구조는 ProcessEventData와 같아야 함
 *
 * @example
 * ```json
 * {
 *     "type": "PROCESS_CREATE",
 *     "timestamp": 1690000000000,
 *     "sequenceNumber": 12345,
 *     "data": {
 *         "processId": 123,
 *         "parentProcessId": 456,
 *         "creatorProcessId": 789,
 *         "flags": 0,
 *         "processCreateTime": 1690000000000,
 *         "matchedRuleId": 42,
 *         "imagePath": "C:\\Windows\\System32\\notepad.exe",
 *         "commandLine": "notepad.exe"
 *     }
 * }
 * ```
 */
export type IncomingIPCMessage = 
	| BaseIPCMessageWithSeq<
		"PROCESS_CREATE" | "PROCESS_TERMINATE" | "PROCESS_BLOCKED",
		ProcessEventData
	>
	| BaseIPCMessageWithSeq<
		"FILE_WRITE" | "FILE_RENAME",
		FileEventData
	>
	| BaseIPCMessageWithSeq<
		"SYSTEM_STATUS",
		SystemStatusData
	> 
	| BaseIPCMessageWithSeq<
		"VSS_ATTEMPT",
		VssAttemptData
	>
	| BaseIPCMessage<
		"ALERT",
		AlertData
	>
	| BaseIPCMessage<
		"VSS_STATUS",
		VssStatusData
	>;



// ---------------------------------------------------------
// [데이터 본문] 커널 파트 (C/C++ Driver)
// ---------------------------------------------------------

export interface ProcessEventData {
    processId: number;
	parentProcessId: number;
	creatorProcessId: number;
    flags: number;
    processCreateTime: number;
	matchedRuleId?: number | null; // BLOCKED일 때만 존재, 0은 생략과 동일
    imagePath?: string | null;     // 경로 추출 실패, 빈 문자열은 생략과 동일
    commandLine?: string | null;   // 인자 추출 실패, 빈 문자열은 생략과 동일
}

export interface FileEventData {
    processId: number;
    operationType: number;        // 1: Write, 2: Rename
    flags: number;
    filePath?: string | null;     // 경로 추출 실패, 빈 문자열은 생략과 동일
	newExtension?: string | null; // Write 이벤트일 때는 확장자 변경이 없으므로 누락, 빈 문자열은 랜섬웨어가 파일 확장자를 지워버렸다는 의미
}

export interface SystemStatusData {
    engineProcessId: number;     // 엔진 pid 값, 0은 아직 미등록 상태 또는 엔진이 죽었다는 의미
    fastPathMode: number;        // 0(OFF), 1(AUDIT), 2(BLOCK)
    selfProtectEnabled: boolean;
    queueDepth: number;
    eventsGenerated: number;
	eventsDropped: number;       // 0보다 크면 큐 과부하 (로그 유실)
    processesBlocked: number;
    processesTerminated: number;
}

export interface VssAttemptData {
    processId: number;
    action: string;
}



// ---------------------------------------------------------
// [데이터 본문] 상관분석 및 복구 파트 (Python / C++)
// ---------------------------------------------------------

export type AlertAction = "BLOCKED" | "ALLOWED" | "QUARANTINED";

export interface AlertData {
    processId: number;
    processName: string;
    action: AlertAction;
    eventId: string;
    threatScore: number;      
    ruleName: string;
	filePath?: string | null; // 파일 훼손이 아닌 행위(인젝션 등) 기반 탐지일 경우 누락, 빈 문자열은 생략과 동일
}

export type VssAction = "BACKUP_CREATED" | "RESTORE_STARTED" | "RESTORE_COMPLETED" | "RESTORE_FAILED";

export interface VssStatusData {
    action: VssAction;
    targetPath: string;
    message: string;
	snapshotId?: string | null; // 백업/복구 실패(FAILED) 시 스냅샷 ID가 없을 수 있음, 빈 문자열은 생략과 동일
}
