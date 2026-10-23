import type { MenuTranslations } from "./types";



export const en: MenuTranslations = {
	tray: {
		open: "Open",
		quit: "Quit",
		notifications: {
			processBlockedTitle: "Threat Process Blocked",
			processBlockedBody: "Process: {{target}} (PID: {{pid}})\nReason: {{reason}}",
			ruleId: "Rule #{{id}}",
			ruleBlocked: "Kernel rule-based block",
			vssAttemptTitle: "VSS Shadow Copy Tamper Attempt",
			vssAttemptBody: "PID: {{pid}}\nCommand: {{action}}",
			alertBlockedTitle: "Ransomware Threat Blocked",
			alertQuarantinedTitle: "Threat Process Quarantined",
			alertBody: "Process: {{processName}} (PID: {{pid}})\nRule: {{ruleName}} (Threat Score: {{score}})",
			restoreCompletedTitle: "Automatic File Restore Completed",
			restoreFailedTitle: "Automatic File Restore Failed",
			restoreBody: "Target: {{targetPath}}\n{{message}}",
			moreEvents: "\n(+{{count}} more critical security events)",
		},
	},
	menu: {
		language: "Language",
		korean: "한국어 (Korean)",
		english: "English",

		file: "File",
		view: "View",
		window: "Window",
		help: "Help",

		quit: "Quit",

		reload: "Reload",
		forceReload: "Force Reload",
		toggleDevTools: "Toggle Developer Tools",
		resetZoom: "Actual Size",
		zoomIn: "Zoom In",
		zoomOut: "Zoom Out",
		toggleFullscreen: "Toggle Full Screen",

		close: "Close",
		minimize: "Minimize",
		zoomWindow: "Zoom",

		github: "Visit GitHub",
		about: "About",
		aboutData: {
			title: "About",
			message: "Ransom0",
			copy: "Copy",
			close: "OK",
		},
	},
};
