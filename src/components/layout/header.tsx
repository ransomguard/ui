import { cn } from "@/lib/utils";

import { ModeToggle } from "@/components/mode-toggle";



export interface HeaderProps extends React.ComponentProps<"header"> {
	heading: string;
}

export function Header({
	heading,
	className,
	...props
}: HeaderProps) {
	return (
		<header
			className={cn(
				"flex justify-between items-center-safe h-(--header-height) backdrop-blur-xs",
				className,
			)}
			{...props}
		>
			<h1 className="text-lg font-semibold">{heading}</h1>
			<ModeToggle/>
		</header>
	);
}
