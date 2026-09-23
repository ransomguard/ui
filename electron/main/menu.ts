import type { BrowserWindow } from "electron";
import { Menu, shell } from "electron";

import { locales } from "../locales";



export function setApplicationMenu(localeCode: string, win: BrowserWindow) {
	const localeKey = localeCode.startsWith("ko") ? "ko" : "en";
	const isKo = localeKey === "ko";
	const i18n = (isKo ? locales.ko : locales.en)!.menu;

	const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
		{
			label: i18n.file,
			submenu: [
				{ label: i18n.quit, role: "quit" },
			],
		},
		{
			label: i18n.view,
			submenu: [
				{ label: i18n.reload, role: "reload" },
				{ label: i18n.forceReload, role: "forceReload" },
				{ label: i18n.toggleDevTools, role: "toggleDevTools" },
				{ type: "separator" },
				{ label: i18n.resetZoom, role: "resetZoom" },
				{ label: i18n.zoomIn, role: "zoomIn" },
				{ label: i18n.zoomOut, role: "zoomOut" },
				{ type: "separator" },
				{ label: i18n.toggleFullscreen, role: "togglefullscreen" },
			],
		},
		{
			label: i18n.window,
			submenu: [
				{ label: i18n.minimize, role: "minimize" },
				{ label: i18n.zoomWindow, role: "zoom" },
				{ label: i18n.close, role: "close" },
			],
		},
		{
			label: i18n.language,
			submenu: [
				{
					label: i18n.korean,
					type: "radio",
					checked: isKo,
					click: () => {
						setApplicationMenu("ko", win);
						win.webContents.send("language-changed", "ko");
					},
				},
				{
					label: i18n.english,
					type: "radio",
					checked: !isKo,
					click: () => {
						setApplicationMenu("en", win);
						win.webContents.send("language-changed", "en");
					},
				},
			],
		},
		{
			label: i18n.help,
			submenu: [
				{
					label: i18n.github,
					click: async () => await shell.openExternal("https://github.com/ransomguard"),
				},
			],
		},
	];

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);

	win.webContents.on("did-finish-load", () => {
		win.webContents.send("language-changed", localeKey);
	});
}
