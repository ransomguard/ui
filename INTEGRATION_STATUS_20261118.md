# 통합 업데이트 — 2026-11-18

이전 integration/unified-defense PR #1 병합 이후 후속 변경입니다.

- 중요한 사건의 판정 근거/확정 결과/시험 출처를 상세 패널에 표시합니다.
- 사건 ID를 payload 전체와 분리하고 Raw JSON이 패널 밖으로 넘치지 않도록 제한합니다.
- 로컬 IPC의 DB commit ACK를 최대 64항목/기존 64KiB 한도 내에서 협상합니다. 구버전은 20항목을 사용합니다.
- 정상 종료와 실제 강제 종료, 시험 기록과 실제 탐지를 구분하는 기존 집계 및 화면 기록을 유지합니다.
- 후속 IPC 처리량 수정은 renderer 디자인 변경이 없습니다. 상세 패널 수정은 앞서 요청된 설명/넘침 수정 범위입니다.

VM 검증에서 상태 저장 지연은 앞선 60.84초 표본에서 3.561/3.290/1.797초로 줄었습니다.
이는 모든 상황의 상한 보장이 아닙니다. 28개 UI 테스트와 lint/타입/Windows 빌드는 완료 검증에서 통과했습니다.

전체 배치 방법: [restore v0.5.0 통합 실행 안내](https://github.com/ransomguard/restore/blob/main/v0.5.0/deployment/README_KO.md).
UI를 단독 실행하는 대신 통합 런처를 사용해야 동일한 firewall holds DB 경로가 전달됩니다.
외부 웹 서버 없이 같은 VM 안의 Ransom0_UI/Ransom0_Firewall 로컬 파이프를 사용합니다.
