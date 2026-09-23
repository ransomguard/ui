import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import * as config from "@/config";

import "./locales/init";
import "./styles/index.css";
import App from "./App.tsx";



(() => {
	// 페이지 로드 시 모드 깜빡임 방지
	try {
		const storageKey = config.key.THEME;
		const theme = localStorage.getItem(storageKey) || "system";
		const isDark =
			theme === "dark" ||
			(theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

		if (isDark) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	} catch {
	}
})();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App/>
	</StrictMode>,
);
