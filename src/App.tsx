import { RouterProvider } from "react-router";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/layout";

import { router } from "@/router";



function App() {
	return (
		<ThemeProvider><TooltipProvider>
			<SidebarProvider>
				<RouterProvider router={router}/>
			</SidebarProvider>
		</TooltipProvider></ThemeProvider>
	);
}

export default App;
