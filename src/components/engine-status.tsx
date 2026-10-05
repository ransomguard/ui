import { useTranslation } from "react-i18next";
import { cva, type VariantProps } from "class-variance-authority";
import {
	ShieldCheck,
	Shield,
	ShieldAlert,
	ShieldOff,
	ShieldBan,
	CheckCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useStatusStore, type StatusValue } from "@/store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";



const engineStatusVariants = cva(
	"transition-all duration-200 border",
	{
		variants: {
			variant: {
				SECURE:
					"bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-500/40",
				AUDIT_ONLY:
					"bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 dark:border-amber-500/40",
				DEGRADED:
					"bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30 dark:border-orange-500/40",
				OFFLINE:
					"bg-muted/50 text-muted-foreground border-border",
				THREAT_BLOCKED:
					"bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20",
			},
			size: {
				default:
					"w-full p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs",
				sm:
					"inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border shadow-2xs select-none",
			},
		},
		defaultVariants: {
			variant: "SECURE",
			size: "default",
		},
	},
);

const STATUS_ICONS: Record<StatusValue, React.ElementType> = {
	SECURE: ShieldCheck,
	AUDIT_ONLY: Shield,
	DEGRADED: ShieldAlert,
	OFFLINE: ShieldOff,
	THREAT_BLOCKED: ShieldBan,
};



export interface EngineStatusProps extends
	React.ComponentProps<"div">,
	Omit<VariantProps<typeof engineStatusVariants>, "variant">
{
	activeToHidden?: boolean;
}



/**
 * 엔진 상태를 표시하는 컴포넌트.
 * - sm: Header 내 아이콘 및 키워드 기반 간략 표시
 * - default: 대시보드 상단 배너 형태
 */
export default function EngineStatus({
	activeToHidden,
	size,
	className,
	...props
}: EngineStatusProps) {
	const { t } = useTranslation();
	const status = useStatusStore((x) => x.status);
	const version = useStatusStore((x) => x.version) ?? "0.0.0";
	const sysData = useStatusStore((x) => x.data);
	const clearUnreadThreats = useStatusStore((x) => x.clearUnreadThreats);

	const variant: StatusValue = status ?? "OFFLINE";
	if (variant === "SECURE" && activeToHidden) {
		return null;
	}

	const Icon = STATUS_ICONS[variant];
	const cariantClassName = engineStatusVariants({ variant: variant, size, className });

	const title = t($ => $.engine.statuses[variant].title);
	const description = t($ => $.engine.statuses[variant].description);
	const kernelVersionText = t(($) => $.engine.kernelVersion, { version });

	if (size === "sm") {
		return (
			<Badge
				className={cariantClassName}
				title={kernelVersionText}
				variant="outline"
				{...props}
			>
				<span className="relative flex size-2 shrink-0">
					<span
						className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-current/50"
					/>
					<span
						className="relative inline-flex size-2 rounded-full bg-current/80"
					/>
				</span>
				<Icon className="size-3.5 shrink-0"/>
				<span className="truncate">{title}</span>
			</Badge>
		);
	}

	return (
		<div
			className={cariantClassName}
			{...props}
		>
			<div className="flex items-start gap-3.5 min-w-0">
				<div
					className={cn(
						"flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background/80 shadow-2xs",
						variant === "SECURE" && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
						variant === "AUDIT_ONLY" && "border-amber-500/30 text-amber-600 dark:text-amber-400",
						variant === "DEGRADED" && "border-orange-500/30 text-orange-600 dark:text-orange-400",
						variant === "OFFLINE" && "border-border text-muted-foreground",
						variant === "THREAT_BLOCKED" && "border-destructive/30 text-destructive",
					)}
				>
					<Icon className="size-5"/>
				</div>

				<div className="flex flex-col gap-1 min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="font-semibold text-sm leading-none tracking-tight">
							{t(($) => $.engine.statusLabel)}: {title}
						</h3>
						<Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
							{kernelVersionText}
						</Badge>
					</div>

					<p className="text-xs text-muted-foreground leading-relaxed">
						{description}
						{variant === "DEGRADED" && sysData?.eventsDropped ? (
							<span className="ml-1 font-medium text-orange-600 dark:text-orange-400">
								{t(($) => $.engine.eventsDropped, { count: sysData.eventsDropped })}
							</span>
						) : null}
					</p>
				</div>
			</div>

			{variant === "THREAT_BLOCKED" ? (
				<Button
					size="sm"
					variant="destructive"
					className="shrink-0 h-8 gap-1.5 text-xs"
					onClick={clearUnreadThreats}
				>
					<CheckCheck className="size-3.5"/>
					<span>{t(($) => $.engine.clearThreats)}</span>
				</Button>
			) : null}
		</div>
	);
}
