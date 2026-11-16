import { describe, it, expect, spyOn } from "bun:test";

import { language } from "~/store";
import { externalIPCReceiver } from "~/services/ipc-receiver";
import {
	showUpdateDownloadedNotification,
	registerUpdaterEvents,
	checkForUpdates,
	isAutoUpdateSupported,
	getCachedUpdateStatus,
	restartAndInstall,
} from "~/main/updater";



describe("AutoUpdater & Update Downloaded Notification", () => {
	it("ko 환경에서 update-downloaded 알림 함수가 정상 호출되는지 검증", () => {
		language.set("ko");
		expect(typeof showUpdateDownloadedNotification).toBe("function");
		showUpdateDownloadedNotification();
	});

	it("en 환경에서 update-downloaded 알림 함수가 정상 호출되는지 검증", () => {
		language.set("en");
		expect(typeof showUpdateDownloadedNotification).toBe("function");
		showUpdateDownloadedNotification();
	});

	it("updater 이벤트 등록 및 비패키징 환경 업데이트 스킵 검증", async () => {
		expect(typeof registerUpdaterEvents).toBe("function");
		registerUpdaterEvents();

		expect(isAutoUpdateSupported()).toBe(false);

		const result = await checkForUpdates();
		expect(result).toBeNull();
	});

	it("알림 클릭 시 IPC 연결 끊기(externalIPCReceiver.stopAll) 정상 호출 검증", () => {
		const stopAllSpy = spyOn(externalIPCReceiver, "stopAll").mockImplementation(() => {});

		externalIPCReceiver.stopAll();

		expect(stopAllSpy).toHaveBeenCalledTimes(1);
		stopAllSpy.mockRestore();
	});

	it("getCachedUpdateStatus 및 restartAndInstall 동작 검증", () => {
		const status = getCachedUpdateStatus();
		expect(status).toBeDefined();
		expect(typeof status.isUpdateDownloaded).toBe("boolean");

		const stopAllSpy = spyOn(externalIPCReceiver, "stopAll").mockImplementation(() => {});
		restartAndInstall();
		expect(stopAllSpy).toHaveBeenCalledTimes(1);
		stopAllSpy.mockRestore();
	});
});
