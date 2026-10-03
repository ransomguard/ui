# 📡 IPC Receiver 통신 규격 및 데이터 연동 가이드

> [!NOTE]
> 커널 v0.5.0 기준 소스코드와 상관분석/복구 기능에 대해 GEMINI에게 설명한 후 생성된 데이터 구조임.
> 즉, 필요에 따라 데이터 구조 변경 가능

커널(C/C++) 및 상관분석/복구(Python 등) 모듈에서
Electron UI(대시보드)로 데이터를 전송하기 위한
**IPC 통신 규칙과 JSON 데이터 구조**를 안내합니다.



## 1. 기본 통신 방식x

* **통로(채널):** Named Pipe (`\\.\pipe\Ransom0UI`)
* **인코딩:** **UTF-8** (한글 디렉토리 및 다국어 악성코드 파일명 보존을 위해 필수)
* **데이터 포맷:** Minified JSON (공백 및 줄바꿈 없는 단일 문자열)
* **스트림 구분 규칙:** 데이터 뭉침 현상(스트림 병목)을 방지하기 위해, **모든 JSON 문자열의 맨 끝에는 반드시 개행 문자(`\n`)를 추가하여 전송**해야 합니다.



## 2. 공통 JSON 구조 (Wrapper)

모든 메시지는 껍데기 역할을 하는 아래의 공통 규격을 지켜야 하며, 실제 상세 내용은 `data` 객체 안에 담아 보냅니다.

```jsonc
{
  "type": "PROCESS_CREATE",
  "timeStamp": 1690000000000,
  "sequenceNumber": 12345,
  "data": {
    // 하단 '3. 타입별 data 상세 규격' 참고
  }
}

```

| 필드명         | 타입   | 필수 | 설명                                                       |
|----------------|--------|------|------------------------------------------------------------|
| type           | String | O    | 이벤트 종류 (아래 목록 참고)                               |
| timeStamp      | Number | O    | 이벤트 발생 시각 (ULONG64)                                 |
| sequenceNumber | Number | X    | 이벤트 순번. (커널 전송용. Python 분석/복구팀은 생략 가능) |
| data           | Object | O    | 실제 이벤트 상세 데이터 객체                               |



## 3. 타입(`type`)별 `data` 상세 규격

전송할 이벤트의 성격에 따라 `type`을 지정하고, 그에 맞는 `data`를 구성해 주시면 됩니다.

### 🔹 프로세스 이벤트 (`PROCESS_CREATE`, `PROCESS_TERMINATE`, `PROCESS_BLOCKED`)

> 커널 파트

| 필드명              | 타입   | 필수 | 설명                                         |
|---------------------|--------|------|----------------------------------------------|
| `processId`         | Number | O    | 대상 프로세스 ID                             |
| `parentProcessId`   | Number | O    | 부모 프로세스 ID (없으면 0)                  |
| `creatorProcessId`  | Number | O    | 생성 요청 프로세스 ID (없으면 0)             |
| `flags`             | Number | O    | ARW_PROC_FLAG_* 비트마스크                   |
| `processCreateTime` | Number | O    | 프로세스 생성 시각 (LONGLONG)                |
| `matchedRuleId`     | Number | X    | 탐지된 룰 ID (`PROCESS_BLOCKED`일 때만 전송) |
| `imagePath`         | String | X    | 프로세스 절대 경로 (경로 추출 실패 시 생략)  |
| `commandLine`       | String | X    | 실행 인자 (인자 추출 실패 시 생략)           |

### 🔹 파일 이벤트 (`FILE_WRITE`, `FILE_RENAME`)

> 커널 파트

| 필드명          | 타입   | 필수 | 설명                                                               |
|-----------------|--------|------|--------------------------------------------------------------------|
| `processId`     | Number | O    | 행위 프로세스 ID                                                   |
| `operationType` | Number | O    | 1 (Write) 또는 2 (Rename)                                          |
| `flags`         | Number | O    | ARW_FILE_FLAG_* 비트마스크                                         |
| `filePath`      | String | X    | 원본 파일 경로 (경로 추출 실패 시 생략)                            |
| `newExtension`  | String | X    | 변경된 확장자 (예: `"locky"` / 점 없이 전송). `FILE_WRITE` 시 생략 |

### 🔹 시스템 상태 (`SYSTEM_STATUS`)

> 커널 파트

| 필드명                | 타입    | 필수 | 설명                                                     |
|-----------------------|---------|------|----------------------------------------------------------|
| `engineProcessId`     | Number  | O    | 등록된 엔진 PID (미등록 시 0)                            |
| `fastPathMode`        | Number  | O    | 0 (OFF), 1 (AUDIT), 2 (BLOCK)                            |
| `selfProtectEnabled`  | Boolean | O    | 자기 보호 활성화 여부                                    |
| `queueDepth`          | Number  | O    | 현재 커널 큐 적재량                                      |
| `eventsGenerated`     | Number  | O    | 누적 발생 이벤트 수                                      |
| `eventsDropped`       | Number  | O    | 버려진(유실된) 이벤트 수 (0보다 크면 대시보드 경고 발생) |
| `processesBlocked`    | Number  | O    | 누적 차단 프로세스 수                                    |
| `processesTerminated` | Number  | O    | 누적 강제 종료 프로세스 수                               |

### 🔹 랜섬웨어 섀도우 카피 삭제 시도 (`VSS_ATTEMPT`)

> 커널 파트

| 필드명      | 타입   | 필수 | 설명                                     |
|-------------|--------|------|------------------------------------------|
| `processId` | Number | O    | 공격 시도 프로세스 ID                    |
| `action`    | String | O    | 행위 설명 (예: `"DELETE_SHADOW_COPIES"`) |

### 🔹 탐지 및 차단 알람 (`ALERT`)

> 분석 파트

| 필드명        | 타입   | 필수 | 설명                                                             |
|---------------|--------|------|------------------------------------------------------------------|
| `processId`   | Number | O    | 탐지된 악성 프로세스 ID                                          |
| `processName` | String | O    | 프로세스 이름 (예: `"malware.exe"`)                              |
| `action`      | String | O    | `"BLOCKED"`, `"ALLOWED"`, `"QUARANTINED"` 중 하나                |
| `eventId`     | String | O    | 고유 탐지 이벤트 ID                                              |
| `threatScore` | Number | O    | 위험 점수 (0 ~ 100)                                              |
| `ruleName`    | String | O    | 탐지에 사용된 룰/규칙 이름                                       |
| `filePath`    | String | X    | 타겟 파일 경로 (파일 훼손이 아닌 프로세스 인젝션 등일 경우 생략) |

### 🔹 파일 복구 상태 (`VSS_STATUS`)

> 복구 파트

| 필드명       | 타입   | 필수 | 설명                                                                                       |
|--------------|--------|------|--------------------------------------------------------------------------------------------|
| `action`     | String | O    | `"BACKUP_CREATED"`, `"RESTORE_STARTED"`, `"RESTORE_COMPLETED"`, `"RESTORE_FAILED"` 중 하나 |
| `targetPath` | String | O    | 백업/복구 대상 경로                                                                        |
| `message`    | String | O    | UI에 표시할 상태 메시지                                                                    |
| `snapshotId` | String | X    | 스냅샷 ID (생성/복구 실패 시 생략 가능)                                                    |



## 4. 데이터 생략(Optional) 규칙

표에서 '선택(X)'으로 표시된 필드는 상황에 따라 데이터를 구하지 못할 수 있는 항목들입니다.
데이터가 존재하지 않을 경우 아래 두 가지 방법 중 편한 방식으로 처리하여 전송하시면 앱이 안전하게 무시합니다.

1. JSON 구성 시 해당 **Key(필드) 자체를 빼고** 전송
2. 해당 필드의 값을 `undefined` 또는 빈 문자열(`""`)로 설정하여 전송

> 💡 **참고:** 전체 데이터 타입과 검증 로직에 대한 코드는
> `types.ts` 및 `guard.ts` 파일에서 확인하실 수 있습니다.
