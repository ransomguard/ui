import { createContext } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";



export interface RowDragHandleContextValue {
	attributes?: DraggableAttributes;
	listeners?: SyntheticListenerMap;
}

export const RowDragHandleContext = createContext<RowDragHandleContextValue>({});
