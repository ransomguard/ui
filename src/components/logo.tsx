import logo from "@/assets/logo.svg";

import { cn } from "@/lib/utils";



export interface LogoProps extends Omit<React.ComponentProps<"img">, "src"> {
}

export function Logo({
	alt = "Ransom0 로고",
	className,
	...props
}: LogoProps) {
	return (
		<img
			className={cn(
				"size-7",
				className,
			)}
			src={logo}
			alt={alt}
			{...props}
		/>
	);
}
