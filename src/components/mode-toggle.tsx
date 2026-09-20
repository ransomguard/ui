import { Sun, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";



interface ModeItemProps {
	value: string;
}

function ModeItem({
	value,
}: ModeItemProps) {
	return (
		<DropdownMenuRadioItem
			value={value}
			className="capitalize font-mono"
		>{value}</DropdownMenuRadioItem>
	);
}



export interface ModeToggleProps extends React.ComponentProps<typeof Button> {
}

export function ModeToggle(props: ModeToggleProps) {
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger
				render={<Button variant="ghost" size="icon" {...props}/>}
			>
				<Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"/>
				<Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"/>
				<span className="sr-only">Toggle theme</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuRadioGroup
					value={theme}
					onValueChange={(value) => setTheme(value)}
				>
					<ModeItem value="light"/>
					<ModeItem value="dark"/>
					<ModeItem value="system"/>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
