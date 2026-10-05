import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { useTranslation } from "react-i18next";

import {
	useStatusStore,
	useMetricStore,
	useAlertStore,
	useTelemetryStore,
	useAccessControlStore,
} from "@/store";

import { Toaster } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/layout";

import { router } from "@/router";



function App() {
	const { i18n } = useTranslation();

	const initStatus = useStatusStore((state) => state.initStatus);
	const updateStatus = useStatusStore((state) => state.updateStatus);

	const initMetrics = useMetricStore((state) => state.initMetrics);
	const addMetrics = useMetricStore((state) => state.addMetrics);

	const initAlerts = useAlertStore((state) => state.initAlerts);
	const addAlerts = useAlertStore((state) => state.addAlerts);

	const initTelemetryEvents = useTelemetryStore((state) => state.initEvents);
	const addTelemetryEvents = useTelemetryStore((state) => state.addEvents);

	const fetchRules = useAccessControlStore((state) => state.fetchRules);

	useEffect(() => {
		window.electronAPI.getLanguage().then((lang) => {
			i18n.changeLanguage(lang);
		});

		const unsub = window.electronAPI.onLanguageChanged((lang) => {
			i18n.changeLanguage(lang);
		});

		return unsub;
	}, [i18n]);

	useEffect(() => {
		window.electronAPI.getEngineStatus().then(initStatus);
		window.electronAPI.getEngineStatus().then((data) => {
			initStatus(data);
			if (data.recentSecurityLogs && data.recentSecurityLogs.length > 0) {
				initMetrics(data.recentSecurityLogs);
				initAlerts(data.recentSecurityLogs);
				initTelemetryEvents(data.recentSecurityLogs);
			}
		});
		fetchRules();
	}, [
		initStatus,
		initMetrics,
		initAlerts,
		initTelemetryEvents,
		fetchRules,
	]);

	useEffect(() => {
		return window.electronAPI.onSecurityLogsUpdated((logs) => {
			if (logs.length > 0) {
				updateStatus(logs);
				addMetrics(logs);
				addAlerts(logs);
				addTelemetryEvents(logs);
			}
		});
	}, [
		updateStatus,
		addMetrics,
		addAlerts,
		addTelemetryEvents,
	]);

	return (
		<ThemeProvider>
			<TooltipProvider>
				<SidebarProvider>
					<RouterProvider router={router}/>
					<Toaster/>
				</SidebarProvider>
			</TooltipProvider>
		</ThemeProvider>
	);
}

export default App;
