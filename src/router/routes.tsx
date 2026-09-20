import type { RouteObject } from "react-router";

import RootLayout from "@/layouts/root-layout";
import NotFound from "@/pages/404";
import Home from "@/pages/home";



export const routes: RouteObject[] = [
	{
		path: "/",
		element: <RootLayout/>,
		children: [
			{
				index: true,
				element: <Home/>,
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
