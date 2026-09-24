import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsEngineActive } from "@/hooks/use-engine";

import {
	Alert,
	AlertTitle,
	AlertDescription,
	AlertAction,
} from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";



export interface EngineStatusProps {
	size?: "default" | "sm"
}

export default function EngineStatus({
	size = "default",
}: EngineStatusProps) {
	const { t } = useTranslation();
	const isActive = useIsEngineActive();
	const [isTurnOffAlertOpen, setIsTurnOffAlertOpen] = useState(false);

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
	const btnMsg = t($ => $.engine[isActive ? "off" : "on"]);
	const turnOff = () => window.electronAPI.stopEngine();
	const turnOn = () => window.electronAPI.startEngine();

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
			<AlertAction>
				<AlertDialog open={isTurnOffAlertOpen} onOpenChange={setIsTurnOffAlertOpen}>
					<Button size="sm" onClick={!isActive ? turnOn : () => setIsTurnOffAlertOpen(true)}>
						{btnMsg}
					</Button>

					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{t($ => $.engine.confirmOff.title)}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{t($ => $.engine.confirmOff.description)}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>
								{t($ => $.engine.confirmOff.cancel)}
							</AlertDialogCancel>
							<AlertDialogAction
								variant="destructive"
								onClick={() => {
									setIsTurnOffAlertOpen(false);
									turnOff();
								}}
							>
								{t($ => $.engine.confirmOff.action)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</AlertAction>
		</Alert>
	);
}
