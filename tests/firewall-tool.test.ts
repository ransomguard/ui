import { describe, test, expect } from "bun:test";

import {
	sendToFirewallTool,
	isValidFirewallMessage,
} from "~/services/firewall-tool";
import { useAccessControlStore } from "@/store";

import { FW_TEST_PIPE_NAME } from "./common";
import { ensureTestPipeServers } from "./preload";



describe("FirewallTool Test Pipe Server (FW_TEST_PIPE_NAME)", () => {
	test("preload의 테스트 파이프 서버(FW_TEST_PIPE_NAME)와 on / off / get / set / refresh 응답 검증", async () => {
		await ensureTestPipeServers();

		// 1. 초기 상태 조회 (get)
		const initialStatus = await sendToFirewallTool(
			{ action: "get" },
			FW_TEST_PIPE_NAME,
		);
		expect(isValidFirewallMessage(initialStatus)).toBe(true);
		if (isValidFirewallMessage(initialStatus)) {
			expect(initialStatus.success).toBe(true);
			if (initialStatus.success) {
				expect(initialStatus.active).toBe(false);
				expect(initialStatus.action).toBe("get");
				const values = initialStatus.whitelist?.map(x => x.value) ?? [];
				expect(values).toContain("10.0.0.1");
			}
		}

		// 2. 전체 네트워크 차단 활성화 (on)
		const onRes = await sendToFirewallTool(
			{ action: "on" },
			FW_TEST_PIPE_NAME,
		);
		expect(isValidFirewallMessage(onRes)).toBe(true);
		if (isValidFirewallMessage(onRes)) {
			expect(onRes.success).toBe(true);
			if (onRes.success) {
				expect(onRes.active).toBe(true);
			}
		}

		// 3. 화이트리스트 룰 설정 (set)
		const setRes = await sendToFirewallTool(
			{
				action: "set",
				whitelist: [
					"192.168.0.1",
					"10.0.0.0/8:22",
					"example.com:443",
					"https://api.github.com/v1",
					"*:8080",
				],
			},
			FW_TEST_PIPE_NAME,
		);
		expect(isValidFirewallMessage(setRes)).toBe(true);
		if (isValidFirewallMessage(setRes)) {
			expect(setRes.success).toBe(true);
			if (setRes.success) {
				expect(setRes.whitelist).toHaveLength(5);
				const types = setRes.whitelist?.map(x => x.type) ?? [];
				expect(types).toContain("domain");
				expect(types).toContain("url");
				expect(types).toContain("ipv4");
			}
		}

		// 4. DNS IP 갱신 (refresh)
		const refreshRes = await sendToFirewallTool(
			{ action: "refresh" },
			FW_TEST_PIPE_NAME,
		);
		expect(isValidFirewallMessage(refreshRes)).toBe(true);
		if (isValidFirewallMessage(refreshRes)) {
			expect(refreshRes.success).toBe(true);
			if (refreshRes.success) {
				expect(refreshRes.active).toBe(true);
			}
		}

		// 5. 네트워크 차단 해제 (off)
		const offRes = await sendToFirewallTool(
			{ action: "off" },
			FW_TEST_PIPE_NAME,
		);
		expect(isValidFirewallMessage(offRes)).toBe(true);
		if (isValidFirewallMessage(offRes)) {
			expect(offRes.success).toBe(true);
			if (offRes.success) {
				expect(offRes.active).toBe(false);
			}
		}

		// 6. 에러 응답 케이스 (유효하지 않은 타겟)
		const failedSet = await sendToFirewallTool(
			{ action: "set", whitelist: ["invalid://error"] },
			FW_TEST_PIPE_NAME,
		);
		expect(isValidFirewallMessage(failedSet)).toBe(true);
		if (isValidFirewallMessage(failedSet)) {
			expect(failedSet.success).toBe(false);
		}
	});

	test("접근 예외 관리 페이지 및 스토어(useAccessControlStore) 연동 및 실시간 조회 기반 set 검증", async () => {
		await ensureTestPipeServers();

		const store = useAccessControlStore.getState();

		// 1. 초기 규칙 및 활성화 상태 로드 (fetchRules)
		await store.fetchRules(true);
		expect(useAccessControlStore.getState().isInitialized).toBe(true);

		// 2. 외부 CLI나 타 프로세스가 파이프로 직접 데몬에 새 룰을 등록한 상황 시뮬레이션
		await sendToFirewallTool(
			{ action: "set", whitelist: ["10.0.0.1", "external-cli-tool.com"] },
			FW_TEST_PIPE_NAME,
		);

		// 3. UI 앱 스토어에서 신규 화이트리스트 대상 등록 요청 (addWhitelist)
		// UI 스토어의 로컬 캐시가 아닌, 데몬 실시간 조회 결과를 기반으로 병합되어야 함
		await store.addWhitelist(["https://service.domain.com/api"]);
		const whitelistValues = useAccessControlStore.getState().whitelistIps;

		// 외부에서 등록된 룰과 새로 등록한 룰 모두 포함되어 있어야 함
		expect(whitelistValues).toContain("external-cli-tool.com");
		expect(whitelistValues).toContain("https://service.domain.com/api");
		expect(
			useAccessControlStore.getState().logs.some(
				(log) => log.target === "whitelist" && log.action === "add" && log.success,
			),
		).toBe(true);

		// 4. 화이트리스트 대상 삭제 (removeWhitelist) - 실시간 조회 후 제외
		await store.removeWhitelist(["external-cli-tool.com"]);
		const valuesAfterRemove = useAccessControlStore.getState().whitelistIps;
		expect(valuesAfterRemove).not.toContain("external-cli-tool.com");
		expect(valuesAfterRemove).toContain("https://service.domain.com/api");

		// 5. DNS 갱신 (refreshWhitelist) - 응답의 whitelist를 통한 실시간 반영 검증
		await store.refreshWhitelist();
		expect(useAccessControlStore.getState().whitelistIps).toContain("https://service.domain.com/api");

		// 6. getFirewallStatus() 직접 호출 시 스토어 실시간 동기화 검증
		const statusRes = await store.getFirewallStatus();
		expect(statusRes.success).toBe(true);
		expect(useAccessControlStore.getState().whitelistItems.length).toBeGreaterThan(0);

		// 7. set 응답에 whitelist가 누락되는 breaking change 발생 시 get fallback을 통한 실시간 반영 검증
		const originalSetWhitelist = window.electronAPI.setWhitelist;
		try {
			// whitelist 필드가 누락된 응답 모킹 (breaking change 시뮬레이션)
			window.electronAPI.setWhitelist = async () => ({
				success: true,
				active: true,
				logs: [],
			});

			// setWhitelist 호출 시 누락된 whitelist를 getFirewallStatus로 fallback 조회하여 반영하는지 확인
			await store.setWhitelist(["https://service.domain.com/api"]);
			expect(useAccessControlStore.getState().whitelistIps).toContain("https://service.domain.com/api");
		} finally {
			window.electronAPI.setWhitelist = originalSetWhitelist;
		}
	});
});
