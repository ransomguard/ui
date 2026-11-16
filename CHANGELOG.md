## [0.1.1](https://github.com/ransomguard/ui/compare/v0.1.0...v0.1.1) (2026-11-16)


### Bug Fixes

* detail sheet 박스 넘침 문제 수정 ([108089d](https://github.com/ransomguard/ui/commit/108089d1bb73e384dc605da065fe34a0a5400177))


### Features

* 차트 기간 선택 값 마지막 선택 값으로 적용 ([7bb6273](https://github.com/ransomguard/ui/commit/7bb6273252c9f8c29255f9ed45cf118d7c1022c9))
* 차트 기간별 간격 변경 (90일: 1일 간격 유지, 1일: 15분 간격으로 변경) ([26630ab](https://github.com/ransomguard/ui/commit/26630abfd993c8c6bb9b532459caf1422f054831))
* 최신 버전 자동 업데이트 및 재시작 알림 제공 ([6da2ba6](https://github.com/ransomguard/ui/commit/6da2ba6278bd7db8eaef912a7ebf1ba68c1d95e6))

## [0.1.0](https://github.com/ransomguard/ui/tree/v0.1.0) (2026-11-16)


### Features

* i18n(en/ko) 지원
* windows 창 크기 등 사용자 지정 상태 저장 및 상태 복구에 활용
* 커널/복구/방화벽 엔진 IPC 기반 연동
* 대시보드 페이지: 현재 보안 상태 및 이벤트 데이터로 card, chart, data table 구성
* 위협 및 복구, 이벤트 로그 페이지: 이벤트별 data table 제공 및 row 클릭 시 상세 정보 표시
* 접근 및 예외 관리: ip 화이트리스트 조회 및 구성, 프로세스 차단 목록 조회 등
* tray 및 toast기반 위협 알림
