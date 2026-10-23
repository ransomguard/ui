import path from "node:path";
import { Menu, Tray } from "electron";

import { locales } from "~/locales";
import { getWindow } from "~/main/window";



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



let tray: Tray | null = null;

export function createTray(localeCode: string) {
	tray = new Tray(getTrayIconPath());
	updateTrayMenu(localeCode);

	tray.setToolTip("Ransom0 UI");
	tray.on("click", openWindow);
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
