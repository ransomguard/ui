import { Outlet, useMatches, type UIMatch } from "react-router";

import { app } from "@/config";

import {
	Header,
	Sidebar,
} from "@/components/layout";



export interface Data {
}

export interface Handle {
	heading?: string;
}

export default function RootLayout() {
	const matches = useMatches() as UIMatch<Data, Handle>[];
	const currentMatch = matches.find(match => match.handle?.heading);
	const heading = (currentMatch ? currentMatch.handle.heading : undefined) || "Default Page Title";

	return (
		<>
			<Sidebar
				heading={app.TITLE}
				userName="John Doe"
				userEmail="john.doe@example.com"
			/>
			<div
				className="flex-1"
				style={{
					"--header-height": "3.5rem",
				} as React.CSSProperties}
			>
				<Header
					heading={heading}
					className="px-6"
				/>
				<main className="py-6 px-6">
					<Outlet/>
				</main>
			</div>
		</>
	);
}
