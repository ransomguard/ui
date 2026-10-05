import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
	return (
		<AccordionPrimitive.Root
			data-slot="accordion"
			className={cn("flex flex-col gap-1", className)}
			{...props}
		/>
	);
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn("border-b", className)}
			{...props}
		/>
	);
}

function AccordionTrigger({
	className,
	children,
	...props
}: AccordionPrimitive.Trigger.Props) {
	return (
		<AccordionPrimitive.Trigger
			data-slot="accordion-trigger"
			className={cn(
				"flex flex-1 items-center justify-between py-3 font-medium transition-all hover:underline [&[data-open]>svg]:rotate-180 cursor-pointer text-sm w-full",
				className,
			)}
			{...props}
		>
			{children}
			<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200"/>
		</AccordionPrimitive.Trigger>
	);
}

function AccordionContent({
	className,
	children,
	...props
}: AccordionPrimitive.Panel.Props) {
	return (
		<AccordionPrimitive.Panel
			data-slot="accordion-content"
			className={cn(
				"overflow-hidden text-sm transition-all data-[closed]:animate-accordion-up data-[open]:animate-accordion-down",
				className,
			)}
			{...props}
		>
			<div className="pb-4 pt-0">{children}</div>
		</AccordionPrimitive.Panel>
	);
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
