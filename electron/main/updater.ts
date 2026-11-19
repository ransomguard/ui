import path from "node:path";
import electron from "electron";
import { autoUpdater } from "electron-updater";

import { locales } from "~/locales";
import { language } from "~/store";
import { AUTO_UPDATE_CHECK_INTERVAL_MS } from "~/config";
import { externalIPCReceiver } from "~/services/ipc-receiver";
import { findWindow } from "./window";

const { app, Notification } = electron;



export interface UpdateStatus {
	isUpdateDownloaded: boolean;
	version?: string;
	releaseDate?: string;
}

let cachedUpdateStatus: UpdateStatus = {
	isUpdateDownloaded: false,
};

export function getCachedUpdateStatus(): UpdateStatus {
	return cachedUpdateStatus;
}

/**
 * 외부 IPC 연결을 끊고 앱 재시작 및 신규 버전 설치
 */
export function restartAndInstall() {
	try {
		externalIPCReceiver.stopAll();
	} catch (err) {
		console.error("[Updater] Failed to stop IPC receiver:", err);
	}

	try {
		autoUpdater.quitAndInstall();
	} catch (err) {
		console.error("[Updater] Failed to quit and install:", err);
	}
}



function getTrayIconPath(): string {
	return path.join(process.env.VITE_PUBLIC, "icons", "256x256.png");
}

function getNotificationI18n() {
	const localeCode = language.get();
	const localeKey = localeCode.startsWith("ko") ? "ko" : "en";
	return (localeKey === "ko" ? locales.ko : locales.en)!.tray.notifications;
}

/**
 * 업데이트 다운로드 완료 알림 표시
 */
export function showUpdateDownloadedNotification() {
	const t = getNotificationI18n();

	if (Notification?.isSupported?.()) {
		const notification = new Notification({
			title: t.updateDownloadedTitle,
			body: t.updateDownloadedBody,
			icon: getTrayIconPath(),
		});

		notification.on("click", () => {
			restartAndInstall();
		});

		notification.show();
	}
}

/**
 * 현재 실행 환경이 자동 업데이트를 온전히 지원하는지 확인
 * - 패키징되지 않은 개발 환경: 패스
 * - Linux: process.env.APPIMAGE가 있는 실제 AppImage 실행 환경에서만 latest-linux.yml 기반 업데이트 지원 (압축해제 폴더 등은 패스)
 */
export function isAutoUpdateSupported(): boolean {
	if (!app?.isPackaged) {
		return false;
	}

	if (process.platform === "linux" && !process.env.APPIMAGE) {
		console.log("[Updater] Running on Linux without APPIMAGE environment. Skipping auto-update.");
		return false;
	}

	return true;
}

/**
 * autoUpdater 이벤트 리스너 등록
 */
export function registerUpdaterEvents() {
	try {
		autoUpdater.autoDownload = true;
		autoUpdater.autoInstallOnAppQuit = true;

		autoUpdater.setFeedURL({
			provider: "github",
			owner: "ransomguard",
			repo: "ui",
		});

		autoUpdater.on("update-downloaded", (info) => {
			console.log("[Updater] Update downloaded successfully:", info?.version);
			cachedUpdateStatus = {
				isUpdateDownloaded: true,
				version: info?.version,
				releaseDate: info?.releaseDate,
			};
			showUpdateDownloadedNotification();
			findWindow()?.webContents.send("updater:status-changed", cachedUpdateStatus);
		});

		autoUpdater.on("error", (err) => {
			console.warn("[Updater] AutoUpdater warning/error (skipped):", err);
		});
	} catch (err) {
		console.warn("[Updater] Unable to register autoUpdater events:", err);
	}
}

/**
 * 자동 업데이트 검사 실행 (지원 환경에서만 실행, 미지원 시 안전하게 패스)
 */
export async function checkForUpdates() {
	if (!isAutoUpdateSupported()) {
		console.log("[Updater] Auto-update is not supported in the current environment. Skipping.");
		return null;
	}

	try {
		return await autoUpdater.checkForUpdates();
	} catch (err) {
		console.warn("[Updater] Failed to check for updates (skipped):", err);
		return null;
	}
}

/**
 * 앱 시작 시 자동 업데이트 초기화 (미지원 시 패스)
 */
export function initAutoUpdater() {
	if (!isAutoUpdateSupported()) {
		return;
	}

	registerUpdaterEvents();
	checkForUpdates().catch(() => {});

	setInterval(() => {
		console.log("[Updater] Polling for updates...");
		checkForUpdates().catch(() => {});
	}, AUTO_UPDATE_CHECK_INTERVAL_MS);
}

