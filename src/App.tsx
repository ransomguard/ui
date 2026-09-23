import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { useTranslation } from "react-i18next";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/layout";

import { router } from "@/router";



function App() {
	const { i18n } = useTranslation();

	useEffect(() => {
		const unsub = window.electronAPI.onLanguageChanged(lang => {
			i18n.changeLanguage(lang);
		});

		return unsub;
	}, [i18n]);

	return (
		<ThemeProvider><TooltipProvider>
			<SidebarProvider>
				<RouterProvider router={router}/>
			</SidebarProvider>
		</TooltipProvider></ThemeProvider>
	);
}

export default App;
