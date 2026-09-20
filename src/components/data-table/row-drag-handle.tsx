import { useContext } from "react";
import { GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";

import { RowDragHandleContext } from "./row-drag-context";



export function RowDragHandle() {
	const { attributes, listeners } = useContext(RowDragHandleContext);

	return (
		<Button
			variant="ghost"
			size="icon"
			className="size-7 text-muted-foreground hover:bg-transparent hover:text-foreground cursor-grab active:cursor-grabbing"
			aria-label="Drag to reorder"
			aria-roledescription="sortable"
			{...attributes}
			{...listeners}
		>
			<GripVertical className="size-3.5 text-muted-foreground"/>
			<span className="sr-only">Drag to reorder</span>
		</Button>
	);
}
