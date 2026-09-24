import type { AppTranslations } from "./types";

export const ko: AppTranslations = {
	sidebar: {
		open: "열기",
		close: "닫기",
		login: "로그인",
		logout: "로그아웃",
		userMenu: {
			profile: "프로필",
			settings: "환경 설정",
		},
	},

	nav: {
		notFound: "페이지를 찾을 수 없음",
		dashboard: "대시보드",
		protectedFolders: "보호 폴더",
		threats: "차단 내역",
		settings: "환경 설정"
	},

	stats: {
		total: "전체",
		totalVisitors: "전체 방문자 수",
		desktop: "데스크톱",
		desktopVisitors: "전체 중 {{ percent }}%",
		mobile: "모바일",
		mobileVisitors: "전체 중 {{ percent }}%",
		dailyAverage: "일평균",
		avgVisitorsPerDay: "일평균 방문자 수",
	},
	timeRange: {
		last90Days: "최근 3개월",
		last30Days: "최근 30일",
		last7Days: "최근 7일",
	},
	chart: {
		heading: "영역 차트",
		description: "{{ timeRange }}간의 전체 방문자 수",
		visitors: "방문자 수",
		desktop: "데스크톱",
		mobile: "모바일",
	},
	ipBlock: {
		heading: "IP 차단 목록",
		columns: {
			ipAddress: "IP 주소",
			blockType: "차단 유형",
			reason: "차단 사유",
			blockedAt: "차단 일시",
		},
		type: {
			manual: "수동 차단",
			auto: "자동 탐지",
		},
		searchPlaceholder: "IP 주소 또는 사유 검색...",
		unblock: "차단 해제",
		addBlockedIp: "IP 차단 추가",
		dialogTitle: "수동 IP 차단 등록",
		dialogDescription: "직접 차단할 특정 IP 주소와 차단 사유를 입력해 주세요.",
		cancel: "취소",
		addBlock: "차단 등록",
		defaultReason: "수동 차단 지정",
		confirmUnblock: {
			title: "IP 차단 해제 확인",
			description: "선택한 {{ count }}개의 IP 주소 차단을 해제하시겠습니까?",
			action: "차단 해제",
		},
		successes: {
			title: "IP {{ action }} 성공",
			added: "IP 주소 {{ ip }}가 차단 목록에 추가되었습니다.",
			removed: "{{ count }}개의 IP가 차단 목록에서 제거되었습니다.",
		},
		errors: {
			title: "IP 차단 등록 실패",
			emptyIp: "IP 주소를 입력해 주세요.",
			invalidIp: "올바른 IPv4 주소 형식이 아닙니다 (예: 192.168.1.100).",
			duplicateIp: "이미 차단 목록에 존재하는 IP 주소입니다.",
		},
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
};
