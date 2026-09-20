import { Outlet, useMatches, type UIMatch } from "react-router";

import {
	Header,
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
		<div
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
	);
}
