import type { BrowserWindow } from "electron";
import { Menu, shell, app, dialog, clipboard } from "electron";

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
				{
					label: i18n.about,
					async click() {
						const version = app.getVersion();
						const detailLines = [
							`Version: ${version}`,
							`Electron: ${process.versions.electron}`,
							`Chrome: ${process.versions.chrome}`,
							`Node.js: ${process.versions.node}`,
							`V8: ${process.versions.v8}`,
							`Chromium: ${process.versions.chromium}`,
							`OS: ${process.platform} ${process.arch}`,
							`Architecture: ${process.arch}`,
						];
						const detailText = detailLines.join("\n");

						const { response } = await dialog.showMessageBox(win, {
							type: "none",
							title: i18n.aboutData.title,
                            message: i18n.aboutData.message,
                            detail: detailText,
                            buttons: [i18n.close, i18n.aboutData.copy], 
                            defaultId: 0,
                            cancelId: 0,
						});
						
						if (response === 1) {
							clipboard.writeText(detailText);
						}
					},
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
