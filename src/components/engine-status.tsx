import { useTranslation } from "react-i18next";
import { ShieldCheck, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsEngineActive } from "@/hooks/use-engine";

import {
	Alert,
	AlertTitle,
	AlertDescription,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";



export interface EngineStatusProps {
	size?: "default" | "sm"
}

export default function EngineStatus({
	size = "default",
}: EngineStatusProps) {
	const { t } = useTranslation();
	const isActive = useIsEngineActive();

	const Icon = isActive ? ShieldCheck : ShieldAlert;
	const vaiant = isActive ? "default" : "destructive";

	if (size === "sm") {
		const msg = t($ => $.engine[isActive ? "active" : "inactive"]);
		return (
			<Badge
				variant={vaiant}
				data-active={isActive ? "" : undefined}
				className={cn(
					"data-active:bg-logo-foreground/10 data-active:border-logo-foreground/50 data-active:text-logo-foreground",
					"not-data-active:border-destructive/50",
				)}
			>
				<Icon/>
				{msg}
			</Badge>
		);
	}

	const title = t($ => $.engine.status);
	const description = t($ => $.engine[isActive ? "activeDescription" : "inactiveDescription"]);
	return (
		<Alert
			variant={vaiant}
			data-active={isActive ? "" : undefined}
			className={cn(
				"data-active:bg-logo-foreground/10 data-active:border-logo-foreground/50 data-active:text-logo-foreground data-active:[--muted-foreground:var(--logo-foreground)]",
				"not-data-active:bg-destructive/10 not-data-active:border-destructive/50",
			)}
		>
			<Icon/>
			<AlertTitle>{title}</AlertTitle>
			<AlertDescription>{description}</AlertDescription>
		</Alert>
	);
}
