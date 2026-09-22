import type { RouteObject } from "react-router";

import RootLayout from "@/layouts/root-layout";
import NotFound from "@/pages/404";
import Dashboard from "@/pages/dashboard";



export const routes: RouteObject[] = [
	{
		path: "/",
		element: <RootLayout/>,
		children: [
			{
				index: true,
				element: <Dashboard/>,
				handle: {
					heading: "Dashboard"
				},
			},
			{
				path: "*",
				element: <NotFound/>,
				handle: {
					heading: "404 Not Found"
				},
			},
		],
	},
];
