import { describe, test, expect } from "bun:test";

import {
	sendToFirewallTool,
	isValidFirewallMessage,
} from "~/services/firewall-tool";
import { useAccessControlStore } from "@/store";

import { FW_TEST_PIPE_NAME } from "./common";
import { ensureTestPipeServers } from "./preload";



describe("FirewallTool Test Pipe Server (FW_TEST_PIPE_NAME)", () => {
	test("preload의 테스트 파이프 서버(FW_TEST_PIPE_NAME)와 list / add / remove / error 응답 검증", async () => {
		await ensureTestPipeServers();

		// 1. 초기 차단 목록 조회 (list)
		const initialBlockList = await sendToFirewallTool(
			{ target: "block", action: "list" },
			FW_TEST_PIPE_NAME,
		);
		expect(isValidFirewallMessage(initialBlockList)).toBe(true);
		if (isValidFirewallMessage(initialBlockList)) {
			expect(initialBlockList.success).toBe(true);
			if (initialBlockList.success) {
				expect(initialBlockList.ips).toContain("185.220.101.42");
			}
		}

		// 2. 차단 IP 추가 (add)
		const addedBlock = await sendToFirewallTool(
			{ target: "block", action: "add", ips: ["203.0.113.77"] },
			FW_TEST_PIPE_NAME,
		);
		expect(isValidFirewallMessage(addedBlock)).toBe(true);
		if (isValidFirewallMessage(addedBlock)) {
			expect(addedBlock.success).toBe(true);
			if (addedBlock.success) {
				expect(addedBlock.ips).toContain("203.0.113.77");
			}
		}

		// 3. 허용 예외(whitelist) IP 추가 (add)
		const addedWhitelist = await sendToFirewallTool(
			{ target: "whitelist", action: "add", ips: ["192.168.1.250"] },
			FW_TEST_PIPE_NAME,
		);
		expect(isValidFirewallMessage(addedWhitelist)).toBe(true);
		if (isValidFirewallMessage(addedWhitelist)) {
			expect(addedWhitelist.success).toBe(true);
			if (addedWhitelist.success) {
				expect(addedWhitelist.ips).toContain("192.168.1.250");
			}
		}

		// 4. 차단 IP 제거 (remove)
		const removedBlock = await sendToFirewallTool(
			{ target: "block", action: "remove", ips: ["45.155.205.233"] },
			FW_TEST_PIPE_NAME,
		);
		expect(isValidFirewallMessage(removedBlock)).toBe(true);
		if (isValidFirewallMessage(removedBlock)) {
			expect(removedBlock.success).toBe(true);
			if (removedBlock.success) {
				expect(removedBlock.ips).not.toContain("45.155.205.233");
			}
		}

		// 5. 에러 응답 케이스 (0.0.0.0 추가 시도)
		const failedAdd = await sendToFirewallTool(
			{ target: "block", action: "add", ips: ["0.0.0.0"] },
			FW_TEST_PIPE_NAME,
		);
		expect(isValidFirewallMessage(failedAdd)).toBe(true);
		if (isValidFirewallMessage(failedAdd)) {
			expect(failedAdd.success).toBe(false);
		}
	});

	test("접근 예외 관리 페이지 및 대시보드 방화벽 탭 스토어(useAccessControlStore) 반영 검증", async () => {
		await ensureTestPipeServers();

		const store = useAccessControlStore.getState();

		// 1. 초기 규칙 조회 (fetchRules)
		await store.fetchRules();
		expect(useAccessControlStore.getState().blockedIps).toContain("185.220.101.42");
		expect(useAccessControlStore.getState().whitelistIps).toContain("10.0.0.1");

		// 2. 신규 차단 IP 등록 후 화면 상태 및 로그 반영 확인
		await store.blockIp(["198.51.100.88"], "랜섬웨어 C2 서버 의심 IP 차단");
		expect(useAccessControlStore.getState().blockedIps).toContain("198.51.100.88");
		expect(
			useAccessControlStore.getState().logs.some(
				(log) => log.target === "block" && log.action === "add" && log.ip === "198.51.100.88" && log.success,
			),
		).toBe(true);

		// 3. 신규 예외(Whitelist) IP 등록 후 화면 상태 및 로그 반영 확인
		await store.addWhitelist(["10.10.0.50"], "사내 백업 스토리지 서버 예외 등록");
		expect(useAccessControlStore.getState().whitelistIps).toContain("10.10.0.50");
		expect(
			useAccessControlStore.getState().logs.some(
				(log) => log.target === "whitelist" && log.action === "add" && log.ip === "10.10.0.50" && log.success,
			),
		).toBe(true);

		// 4. 차단 해제(unblockIp) 시 목록에서 제거되고 remove 로그가 기록되는지 확인
		await store.unblockIp(["198.51.100.88"], "사용자 수동 차단 해제");
		expect(useAccessControlStore.getState().blockedIps).not.toContain("198.51.100.88");
		expect(
			useAccessControlStore.getState().logs.some(
				(log) => log.target === "block" && log.action === "remove" && log.ip === "198.51.100.88" && log.success,
			),
		).toBe(true);

		// 5. 화이트리스트 해제(removeWhitelist) 시 목록에서 제거되고 remove 로그가 기록되는지 확인
		await store.removeWhitelist(["10.10.0.50"], "사용자 수동 예외 해제");
		expect(useAccessControlStore.getState().whitelistIps).not.toContain("10.10.0.50");
		expect(
			useAccessControlStore.getState().logs.some(
				(log) => log.target === "whitelist" && log.action === "remove" && log.ip === "10.10.0.50" && log.success,
			),
		).toBe(true);

		// 6. 실패 응답(0.0.0.0) 시 기존 목록이 유지되고 에러 메시지 및 실패 로그가 기록되는지 확인
		await store.blockIp(["198.51.100.99"], "유지 확인용 차단 IP");
		expect(store.blockIp(["0.0.0.0"], "잘못된 예약 주소 차단 시도")).rejects.toThrow("0.0.0.0");
		await store.blockIp(["0.0.0.0"], "잘못된 예약 주소 차단 시도").catch(() => {});

		expect(useAccessControlStore.getState().blockedIps).toContain("198.51.100.99");
		expect(useAccessControlStore.getState().error).toContain("0.0.0.0");
		expect(
			useAccessControlStore.getState().logs.some(
				(log) => log.target === "block" && log.action === "add" && !log.success,
			),
		).toBe(true);
	});
});
