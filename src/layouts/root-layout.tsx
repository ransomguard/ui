import { Outlet, useMatches, type UIMatch } from "react-router";
import { useTranslation } from "react-i18next";

import { app } from "@/config";
import type { FlattenedKeys } from "@/locales";

import {
	Header,
	Sidebar,
} from "@/components/layout";



export interface Data {
}

export interface Handle {
	heading?: FlattenedKeys<"heading">;
}

export default function RootLayout() {
	const { t } = useTranslation();

	const matches = useMatches() as UIMatch<Data, Handle>[];
	const currentMatch = matches.find(match => match.handle?.heading);
	const headingKey = (currentMatch ? currentMatch.handle.heading : undefined);

	const heading = headingKey ? t($ => $.heading[headingKey]) : "Default Page Title";

	return (
		<>
			<Sidebar
				heading={app.TITLE}
				userName="John Doe"
				userEmail="john.doe@example.com"
			/>
			<div
				className="flex-1 min-w-0 flex flex-col"
				style={{
					"--header-height": "3.5rem",
				} as React.CSSProperties}
			>
				<Header
					heading={heading}
					className="px-6"
				/>
				<main className="py-6 px-6 flex-1 min-w-0">
					<Outlet/>
				</main>
			</div>
		</>
	);
}
