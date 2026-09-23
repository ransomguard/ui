import { useContext } from "react";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { RowDragHandleContext } from "./row-drag-context";



export interface RowDragHandleProps extends React.ComponentProps<typeof Button> {
}

export function RowDragHandle({
	className,
	...props
}: RowDragHandleProps) {
	const { attributes, listeners } = useContext(RowDragHandleContext);

	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label="Drag to reorder"
			aria-roledescription="sortable"
			className={cn(
				"size-7 text-muted-foreground hover:bg-transparent hover:text-foreground cursor-grab active:cursor-grabbing",
				className,
			)}
			{...attributes}
			{...listeners}
			{...props}
		>
			<GripVertical className="size-3.5 text-muted-foreground"/>
			<span className="sr-only">Drag to reorder</span>
		</Button>
	);
}
