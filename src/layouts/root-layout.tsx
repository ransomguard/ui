import { useEffect, useRef } from "react";
import { Outlet, useLocation, useMatches, type UIMatch } from "react-router";
import { useTranslation } from "react-i18next";

import { app, constants } from "@/config";
import type { FlattenedKeys } from "@/locales";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Header,
	Sidebar,
} from "@/components/layout";



export interface Data {
}

export interface Handle {
	heading?: FlattenedKeys<"nav">;
}

export default function RootLayout() {
	const { t } = useTranslation();
	const { pathname } = useLocation();
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	const matches = useMatches() as UIMatch<Data, Handle>[];
	const currentMatch = matches.find(match => match.handle?.heading);
	const headingKey = (currentMatch ? currentMatch.handle.heading : undefined);

	const heading = headingKey ? t($ => $.nav[headingKey]) : "Default Page Title";

	useEffect(() => {
		const viewport = scrollAreaRef.current?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
		if (viewport) {
			viewport.scrollTop = 0;
		}
	}, [pathname]);

	return (
		<>
			<Sidebar
				heading={app.TITLE}
				navGroups={constants.NAV_ITEMS}
				openText={t($ => $.sidebar.open)}
				closeText={t($ => $.sidebar.close)}
			/>
			<div
				className="flex-1 min-w-0 h-svh overflow-hidden flex flex-col"
				style={{
					"--header-height": "3.5rem",
				} as React.CSSProperties}
			>
				<Header
					heading={heading}
					className="px-6 shrink-0"
				/>
				<ScrollArea
					ref={scrollAreaRef}
					className="flex-1 min-h-0 min-w-0"
				>
					<main className="py-6 px-6 min-w-0">
						<Outlet/>
					</main>
				</ScrollArea>
			</div>
		</>
	);
}
