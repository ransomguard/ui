import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/index.css";
import App from "./App.tsx";



createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App/>
	</StrictMode>,
);



// Use contextBridge, for electron
window.ipcRenderer?.on("main-process-message", (_event, message) => {
	console.log(message);
});
