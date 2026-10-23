import path from "node:path";
import electron from "electron";

import { locales } from "~/locales";
import { language } from "~/store";
import { getWindow } from "~/main/window";

const { Menu, Tray, Notification } = electron;



function openWindow() {
	const win = getWindow();
	if (win.isMinimized()) {
		win.restore();
	}
	win.show();
	win.focus();
}

function getTrayIconPath(): string {
	return path.join(process.env.VITE_PUBLIC, "logo.png");
}

function getTrayI18n(localeCode: string) {
	const localeKey = localeCode.startsWith("ko") ? "ko" : "en";
	const isKo = localeKey === "ko";
	const i18n = (isKo ? locales.ko : locales.en)!.tray;
	return i18n;
}



let tray: electron.Tray | null = null;

export function createTray(localeCode: string) {
	tray = new Tray(getTrayIconPath());
	updateTrayMenu(localeCode);

	tray.setToolTip("Ransom0 UI");
	tray.on("click", openWindow);
	tray.on("balloon-click", openWindow);
}

export function updateTrayMenu(localeCode: string) {
	if (!tray || tray.isDestroyed()) return;

	const i18n = getTrayI18n(localeCode);

	const contextMenu = Menu.buildFromTemplate([
		{
			label: i18n.open,
			click: openWindow,
		},
		{ type: "separator" },
		{ label: i18n.quit, role: "quit" },
	]);
	tray.setContextMenu(contextMenu);
}



// tray 말풍선 알림

const PATH_SEPARATOR_REGEX = /[/\\]/;
const INTERPOLATION_REGEX = /\{\{\s*(\w+)\s*\}\}/g;

function interpolate(template: string, params: Record<string, string | number>): string {
	return template.replace(INTERPOLATION_REGEX, (_, key: string) => String(params[key] ?? ""));
}

/**
 * 전체 IPC 이벤트 중 트레이 알림을 띄워야 하는 중요 보안/복구 이벤트인지 판별
 * - PROCESS_BLOCKED: 커널 드라이버의 프로세스 차단
 * - VSS_ATTEMPT: 볼륨 섀도우 카피 삭제/훼손 시도 탐지
 * - ALERT (BLOCKED / QUARANTINED): 상관분석 엔진의 랜섬웨어 차단 및 격리
 * - VSS_STATUS (RESTORE_COMPLETED / RESTORE_FAILED): 자동 파일 복구 완료 및 실패
 */
export function isImportantEvent(msg: IncomingIPCMessage): boolean {
	switch (msg.type) {
		case "PROCESS_BLOCKED":
		case "VSS_ATTEMPT":
			return true;
		case "ALERT":
			return msg.data.action === "BLOCKED" || msg.data.action === "QUARANTINED";
		case "VSS_STATUS":
			return msg.data.action === "RESTORE_COMPLETED" || msg.data.action === "RESTORE_FAILED";
		default:
			return false;
	}
}

export interface TrayNotificationPayload {
	title: string;
	content: string;
	iconType: "info" | "warning" | "error";
	count: number;
}

export function formatImportantEventNotification(
	msg: IncomingIPCMessage,
	localeCode: string,
): Omit<TrayNotificationPayload, "count"> {
	const t = getTrayI18n(localeCode).notifications;

	switch (msg.type) {
		case "PROCESS_BLOCKED": {
			const rawPath = msg.data.imagePath || msg.data.commandLine || "-";
			const target = msg.data.imagePath
				? msg.data.imagePath.split(PATH_SEPARATOR_REGEX).pop() || msg.data.imagePath
				: rawPath;
			const reason = msg.data.matchedRuleId
				? interpolate(t.ruleId, { id: msg.data.matchedRuleId })
				: t.ruleBlocked;

			return {
				title: t.processBlockedTitle,
				content: interpolate(t.processBlockedBody, {
					target,
					pid: msg.data.processId,
					reason,
				}),
				iconType: "error",
			};
		}
		case "VSS_ATTEMPT": {
			return {
				title: t.vssAttemptTitle,
				content: interpolate(t.vssAttemptBody, {
					pid: msg.data.processId,
					action: msg.data.action,
				}),
				iconType: "error",
			};
		}
		case "ALERT": {
			const isQuarantined = msg.data.action === "QUARANTINED";
			return {
				title: isQuarantined ? t.alertQuarantinedTitle : t.alertBlockedTitle,
				content: interpolate(t.alertBody, {
					processName: msg.data.processName,
					pid: msg.data.processId,
					ruleName: msg.data.ruleName,
					score: msg.data.threatScore,
				}),
				iconType: isQuarantined ? "warning" : "error",
			};
		}
		case "VSS_STATUS": {
			const isFailed = msg.data.action === "RESTORE_FAILED";
			return {
				title: isFailed ? t.restoreFailedTitle : t.restoreCompletedTitle,
				content: interpolate(t.restoreBody, {
					targetPath: msg.data.targetPath,
					message: msg.data.message,
				}),
				iconType: isFailed ? "error" : "info",
			};
		}
		default: {
			return {
				title: "Ransom0 UI",
				content: msg.type,
				iconType: "info",
			};
		}
	}
}

export function notifyImportantEvents(
	messages: IncomingIPCMessage[],
): TrayNotificationPayload | null {
	const importantMessages = messages.filter(isImportantEvent);
	if (importantMessages.length === 0) {
		return null;
	}

	// 배치 내 가장 최근의 중요 이벤트를 대표로 표시하되, 위협(차단/훼손/복구실패) 이벤트를 우선 선택
	const primaryMessage =
		[...importantMessages]
			.reverse()
			.find((m) => !(m.type === "VSS_STATUS" && m.data.action === "RESTORE_COMPLETED")) ??
		importantMessages[importantMessages.length - 1]!;

	const localeCode = language.get();
	const formatted = formatImportantEventNotification(primaryMessage, localeCode);
	const t = getTrayI18n(localeCode).notifications;
	const extraCount = importantMessages.length - 1;
	const content =
		extraCount > 0
			? `${formatted.content}${interpolate(t.moreEvents, { count: extraCount })}`
			: formatted.content;

	const payload: TrayNotificationPayload = {
		title: formatted.title,
		content,
		iconType: formatted.iconType,
		count: importantMessages.length,
	};

	if (tray && !tray.isDestroyed() && process.platform === "win32") {
		tray.displayBalloon({
			iconType: payload.iconType,
			title: payload.title,
			content: payload.content,
		});
	} else if (Notification?.isSupported()) {
		const notification = new Notification({
			title: payload.title,
			body: payload.content,
			icon: getTrayIconPath(),
		});
		notification.on("click", openWindow);
		notification.show();
	}

	return payload;
}
