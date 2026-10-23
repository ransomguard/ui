import type { MenuTranslations } from "./types";



export const ko: MenuTranslations = {
	tray: {
		open: "열기",
		quit: "끝내기",
		notifications: {
			processBlockedTitle: "위협 프로세스 차단됨",
			processBlockedBody: "프로세스: {{target}} (PID: {{pid}})\n사유: {{reason}}",
			ruleId: "Rule #{{id}}",
			ruleBlocked: "커널 룰 기반 차단",
			vssAttemptTitle: "VSS 섀도우 카피 훼손 시도 탐지",
			vssAttemptBody: "PID: {{pid}}\n명령: {{action}}",
			alertBlockedTitle: "랜섬웨어 위협 탐지 및 차단",
			alertQuarantinedTitle: "위협 프로세스 격리됨",
			alertBody: "프로세스: {{processName}} (PID: {{pid}})\n탐지 룰: {{ruleName}} (위협 점수: {{score}})",
			restoreCompletedTitle: "훼손 파일 자동 복구 완료",
			restoreFailedTitle: "훼손 파일 자동 복구 실패",
			restoreBody: "대상: {{targetPath}}\n{{message}}",
			moreEvents: "\n(외 {{count}}건의 중요 보안 이벤트 발생)",
		},
	},
	menu: {
		language: "언어",
		korean: "한국어",
		english: "English",

		file: "파일",
		view: "보기",
		window: "창",
		help: "도움말",

		quit: "끝내기",

		reload: "새로 고침",
		forceReload: "강력 새로 고침",
		toggleDevTools: "개발자 도구 전환",
		resetZoom: "실제 크기",
		zoomIn: "확대",
		zoomOut: "축소",
		toggleFullscreen: "전체 화면 전환",

		close: "닫기",
		minimize: "최소화",
		zoomWindow: "확대/축소",

		github: "GitHub 방문",
		about: "정보",
		aboutData: {
			title: "About",
			message: "Ransom0",
			copy: "복사",
			close: "확인",
		},
	},
};
