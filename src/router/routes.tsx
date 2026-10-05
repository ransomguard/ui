import type { RouteObject } from "react-router";

import RootLayout from "@/layouts/root-layout";
import NotFound from "@/pages/404";
import Dashboard from "@/pages/dashboard";
import AlertsPage from "@/pages/alerts";
import TelemetryPage from "@/pages/telemetry";
import AccessControlPage from "@/pages/access-control";

export const routes: RouteObject[] = [
	{
		path: "/",
		element: <RootLayout/>,
		children: [
			{
				index: true,
				element: <Dashboard/>,
				handle: {
					heading: "dashboard",
				},
			},
			{
				path: "alerts",
				element: <AlertsPage/>,
				handle: {
					heading: "alerts",
				},
			},
			{
				path: "telemetry",
				element: <TelemetryPage/>,
				handle: {
					heading: "telemetry",
				},
			},
			{
				path: "access-control",
				element: <AccessControlPage/>,
				handle: {
					heading: "accessControl",
				},
			},
			{
				path: "*",
				element: <NotFound/>,
				handle: {
					heading: "notFound",
				},
			},
		],
	},
];
