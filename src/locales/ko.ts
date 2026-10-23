import type { AppTranslations } from "./types";

export const ko: AppTranslations = {
	sidebar: {
		open: "열기",
		close: "닫기",
	},

	nav: {
		notFound: "페이지를 찾을 수 없음",
		dashboard: "대시보드",
		alerts: "위협 및 복구",
		telemetry: "이벤트 로그",
		accessControl: "접근 및 예외 관리",
	},

	notFound: {
		title: "페이지를 찾을 수 없습니다",
		goHome: "홈으로 돌아가기",
	},

	engine: {
		statusLabel: "PC 보안 상태",
		kernelVersion: "커널 버전: v{{ version }}",
		clearThreats: "위협 확인 완료",
		eventsDropped: "(유실된 이벤트: {{ count }}건)",
		statuses: {
			SECURE: {
				title: "실시간 보호 중",
				description: "커널 드라이버가 활성화되어 시스템이 안전하게 보호되고 있습니다.",
			},
			AUDIT_ONLY: {
				title: "탐지 모드 (감시 전용)",
				description: "차단 기능 없이 위협 탐지 및 로깅만 수행 중입니다.",
			},
			DEGRADED: {
				title: "보호 기능 저하됨",
				description: "커널 이벤트 처리 과부하 또는 유실이 발생하고 있습니다.",
			},
			OFFLINE: {
				title: "엔진 비활성화 (연결 끊김)",
				description: "엔진 서비스가 중지되었거나 커널 드라이버와 연결할 수 없습니다.",
			},
			THREAT_BLOCKED: {
				title: "위협 감지 및 차단됨",
				description: "의심스러운 랜섬웨어 행위 또는 보안 위협이 차단되었습니다.",
			},
		},
	},

	stats: {
		processesBlocked: "차단된 프로세스",
		processesBlockedDesc: "실시간 보호로 차단된 프로세스 수",
		processesTerminated: "종료된 프로세스",
		processesTerminatedDesc: "위협 행위로 강제 종료된 프로세스 수",
		queueDepth: "큐 대기 깊이",
		queueDepthDesc: "현재 커널 이벤트 처리 대기 수",
		eventsDropped: "유실된 이벤트",
		eventsDroppedDesc: "부하로 인해 유실된 이벤트 수",
	},

	timeRange: {
		lastDays: "최근 {{ days }}일",
		lastDay: "최근 1일",
	},

	table: {
		filterPlaceholder: "필터링...",
		rowsPerPage: "페이지당 행 수",
		pageOf: "{{ total }}페이지 중 {{ page }}페이지",
		selectedRows: "전체 {{ total }}개 중 {{ selected }}개 선택됨",
		noResults: "결과가 없습니다.",
		firstPage: "첫 페이지로 이동",
		previousPage: "이전 페이지로 이동",
		nextPage: "다음 페이지로 이동",
		lastPage: "마지막 페이지로 이동",
		columns: "컬럼 선택",
	},

	chart: {
		heading: "위협 탐지 추이",
		description: "{{ timeRange }}간의 탐지 및 차단 이벤트 통계",
		visitors: "이벤트 수",
		desktop: "차단됨",
		mobile: "감시됨",
	},

	recentEvents: {
		heading: "최근 통합 보안 이벤트 요약",
		searchPlaceholder: "대상, 이벤트 유형, 요약 내용 검색...",
		defaultReason: "수동 차단 지정",
		threatScoreSummary: "{{ ruleName }} • 위협 점수 {{ score }}",
		ruleSummary: "Rule #{{ ruleId }} (PID: {{ pid }})",
		pidPpidSummary: "PID: {{ pid }} • PPID: {{ ppid }}",
		pidExtSummary: "PID: {{ pid }} • 확장자: {{ ext }}",
		pidSummary: "PID: {{ pid }}",
		tabs: {
			all: "전체",
			threat: "위협",
			recovery: "복구",
			telemetry: "이벤트",
			firewall: "방화벽",
		},
		columns: {
			category: "구분",
			action: "유형",
			target: "대상",
			summary: "핵심 요약",
			timestamp: "발생 일시",
		},
		categories: {
			threat: "위협",
			recovery: "복구",
			telemetry: "이벤트",
			firewall: "방화벽",
		},
	},

	alerts: {
		heading: "보안 알림 및 복구 내역",
		description: "커널 차단, 랜섬웨어 탐지 및 VSS 백업 복구 이벤트를 피드로 확인하고 세부 정보를 검토합니다.",
		threatCount: "위협 탐지: {{ count }}건",
		recoveryCount: "자동 복구: {{ count }}건",
		searchPlaceholder: "프로세스명, 룰, 경로 검색...",
		filters: {
			all: "전체 이벤트 보기",
			threats: "위협 탐지/차단 전용",
			recovery: "복구 내역 전용",
		},
		empty: {
			title: "감지된 특이 보안 알림이 없습니다",
			description: "현재 시스템이 안전하며 실시간 위협 및 복구 알림 내역이 수신되면 이 화면에 바로 업데이트됩니다.",
		},
		card: {
			source: "소스: {{ source }}",
			threatScore: "위협 위험도 (Threat Score)",
			rawJson: "상세 Raw 메타데이터 JSON 보기",
		},
		sources: {
			kernelDriver: "Kernel Driver",
			correlationEngine: "Correlation Engine",
			vssFilter: "VSS Filter",
			vssRestoreEngine: "VSS Restore Engine",
		},
		defaults: {
			ruleId: "Rule #{{ id }}",
			ruleBlocked: "룰 기반 차단",
			vssTamperAttempt: "VSS 섀도우 카피 훼손 시도 탐지",
			vssBackupRestore: "VSS 백업 및 복구",
		},
	},

	telemetry: {
		heading: "이벤트 텔레메트리 뷰어 (Telemetry)",
		description: "커널 드라이버 및 미니필터에서 발생한 프로세스 생성, 파일 I/O 및 로우 이벤트를 고밀도로 정밀 조회합니다.",
		tableHeading: "이벤트 로그 텔레메트리 (특정 행 클릭 시 세부 검사 가능)",
		searchPlaceholder: "프로세스명, 이미지 경로, 룰 이름 검색...",
		sourceKernelDriver: "Kernel Driver",
		matchedRuleId: "Rule #{{ id }}",
		columns: {
			createdAt: "생성 시각",
			action: "이벤트 타입",
			processId: "PID",
			processName: "프로세스명",
			imagePath: "대상 이미지 / 파일 경로",
			source: "이벤트 소스",
		},
		sheet: {
			title: "상세 이벤트 메타데이터 검사",
			description: "이벤트 ID #{{ id }} • {{ source }}",
			createdAt: "생성 시각",
			actionResult: "액션 결과",
			processId: "프로세스 ID (PID)",
			processName: "프로세스명",
			imagePath: "대상 실행 파일 이미지 경로",
			matchedRule: "탐지 룰 (Matched Rule)",
			rawJson: "세부 Raw JSON 데이터",
		},
	},

	accessControl: {
		heading: "접근 및 정책 제어 (Access Control)",
		description: "방화벽 차단/허용 IP 및 차단된 프로세스 목록을 조회하고 정책 변경 이력 로그를 확인합니다.",
		addPolicy: "신규 정책/IP 추가",
		tabs: {
			blockedIps: "방화벽 차단 IP ({{ count }})",
			whitelistedIps: "방화벽 허용 IP ({{ count }})",
			blockedProcesses: "프로세스 차단 목록 ({{ count }})",
			accessLogs: "접근 제어 로그 ({{ count }})",
		},
		dialog: {
			blockTitle: "수동 IP 차단 등록",
			whitelistTitle: "허용 IP (화이트리스트) 등록",
			description: "신규 IP 주소를 등록하여 방화벽 보안 정책에 즉시 반영합니다.",
			blockIpLabel: "차단할 IPv4 주소",
			blockIpPlaceholder: "예: 192.168.1.100",
			blockReasonLabel: "차단 사유",
			blockReasonPlaceholder: "사유 입력 (예: 해킹 시도 IP 수동 차단)",
			whitelistIpLabel: "허용할 IPv4 주소",
			whitelistIpPlaceholder: "예: 10.0.0.50",
			whitelistDescLabel: "설명 / 식별자",
			whitelistDescPlaceholder: "예: 신뢰할 수 있는 개발용 서버",
			cancel: "취소",
			submit: "등록 완료",
		},
		blockedTable: {
			heading: "차단된 IP 주소 목록",
			searchPlaceholder: "IP 주소 또는 차단 사유 검색...",
			columns: {
				ipAddress: "차단 IP 주소",
				reason: "차단 사유",
				blockedAt: "차단 일시",
				actions: "관리",
			},
			unblockAction: "차단 해제",
		},
		whitelistTable: {
			heading: "허용된 IP 주소 목록 (화이트리스트)",
			searchPlaceholder: "IP 주소 또는 설명 검색...",
			columns: {
				ipAddress: "허용 IP 주소",
				description: "설명 / 식별자",
				addedAt: "등록 일시",
				actions: "관리",
			},
			removeAction: "허용 삭제",
		},
		blockedProcessesTable: {
			heading: "차단된 프로세스 목록",
			searchPlaceholder: "프로세스명, PID, 경로 또는 차단 사유 검색...",
			columns: {
				processId: "PID",
				processName: "프로세스명",
				imagePath: "대상 이미지 / 파일 경로",
				reason: "차단 사유 / 탐지 룰",
				source: "탐지 엔진",
				blockedAt: "차단 일시",
			},
		},
		logsTable: {
			heading: "방화벽 접근 제어 변경 이력 로그",
			searchPlaceholder: "IP 주소, 사유, 작업 유형 검색...",
			columns: {
				performedAt: "수행 일시",
				target: "정책 대상",
				action: "작업 유형",
				ipAddress: "대상 IP 주소",
				reason: "사유 / 설명",
				status: "처리 결과",
			},
			targets: {
				block: "차단 IP",
				whitelist: "허용 IP",
			},
			actions: {
				add: "등록 (ADD)",
				remove: "해제 (REMOVE)",
			},
			statuses: {
				success: "성공",
				failed: "실패",
			},
		},
		deleteDialog: {
			title: "정책 항목 삭제 확인",
			description: "선택한 정책/IP 항목({{ item }})을 목록에서 삭제하시겠습니까? 삭제 후에는 보안 엔진 규칙에 즉시 반영됩니다.",
			cancel: "취소",
			confirm: "삭제 수행",
		},
		defaults: {
			manualBlockReason: "관리자 수동 차단",
			manualWhitelistDesc: "관리자 수동 허용",
			manualUnblockReason: "수동 차단 해제",
			manualRemoveWhitelistReason: "수동 허용 삭제",
		},
		toasts: {
			invalidIp: "올바른 IPv4 주소 형식을 입력해 주세요.",
			blockedAdded: "IP 주소 {{ ip }}가 차단 목록에 추가되었습니다.",
			whitelistAdded: "IP 주소 {{ ip }}가 허용 목록에 추가되었습니다.",
			blockedRemoved: "차단 IP {{ ip }}가 해제되었습니다.",
			whitelistRemoved: "허용 IP {{ ip }}가 삭제되었습니다.",
		},
	},
};
