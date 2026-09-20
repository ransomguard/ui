import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { SidebarTrigger } from "@/components/layout/sidebar";
import { ModeToggle } from "@/components/mode-toggle";



export interface HeaderProps extends React.ComponentProps<"header"> {
	heading: string;
}

export function Header({
	heading,
	className,
	...props
}: HeaderProps) {
	const isMobile = useIsMobile();

	return (
		<header
			className={cn(
				"flex justify-between items-center-safe h-(--header-height) backdrop-blur-xs",
				className,
			)}
			{...props}
		>
			<div className="flex items-center gap-4">
				{isMobile && <SidebarTrigger/>}
				<h1 className="text-lg font-semibold">{heading}</h1>
			</div>
			<ModeToggle/>
		</header>
	);
}
