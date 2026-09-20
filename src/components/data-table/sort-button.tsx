import {
	ArrowDownAZ,
	ArrowDownZA,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";



export interface SortButtonProps extends React.ComponentProps<typeof Button> {
	sorted: "asc" | "desc" | null;
}

export function SortButton({
	sorted,
	className,
	children,
	...props
}: SortButtonProps) {
	return (
		<Button
			variant="ghost"
			size="sm"
			className={cn(
				"p-0 bg-transparent! cursor-pointer",
				className,
			)}
			{...props}
		>
			{children}
			<ArrowDownAZ
				className={cn(
					"ml-2 h-4 w-4",
					!sorted && "invisible group-hover/button:visible text-muted-foreground",
					sorted === "desc" && "hidden"
				)}
			/>
			<ArrowDownZA
				className={cn(
					"ml-2 h-4 w-4",
					!sorted && "hidden",
					sorted === "asc" && "hidden"
				)}
			/>
		</Button>
	);
}
