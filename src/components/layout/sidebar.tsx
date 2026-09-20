import { Link } from "react-router";
import {
	PanelLeft,
	PanelLeftOpen,
	PanelLeftClose,
	ChevronsUpDown,
	Sparkles,
	BadgeCheck,
	CreditCard,
	Bell,
	LogOut,
	TerminalSquare,
	Bot,
	BookOpen,
	Settings2,
	ChevronRight,
	Frame,
	Ellipsis,
	Folder,
	Forward,
	Trash2,
	ChartPie,
	Map,
} from "lucide-react";

import { cn } from "@/lib/utils";

import * as Base from "@/components/ui/sidebar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuItem as BaseDropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";



export const SidebarProvider = Base.SidebarProvider;
export interface SidebarProviderProps extends React.ComponentProps<typeof Base.SidebarProvider> {
}

export const SidebarTrigger = Base.SidebarTrigger;
export interface SidebarTriggerProps extends React.ComponentProps<typeof Base.SidebarTrigger> {
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSidebar = Base.useSidebar;



interface DropdownMenuItemProps extends React.ComponentProps<typeof BaseDropdownMenuItem> {
	icon?: React.ReactNode;
	shortcut?: string;
}

function DropdownMenuItem({
	icon,
	shortcut,
	children,
	...props
}: DropdownMenuItemProps) {
	return (
		<BaseDropdownMenuItem {...props}>
			{icon}
			{children}
			{shortcut && (
				<DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>
			)}
		</BaseDropdownMenuItem>
	);
}



interface MenuItemGroupProps extends React.ComponentProps<"div"> {
	label?: string;
	description?: string;
}

function MenuItemGroup({
	label,
	description,
	className,
	...props
}: MenuItemGroupProps) {
	return (
		<div
			className={cn(
				"grid flex-1 text-left text-sm leading-tight",
				className,

			)}
			{...props}
		>
			<span className="truncate font-medium">{label}</span>
			<span className="truncate text-xs">{description}</span>
		</div>
	);
}



export interface SidebarProps extends Omit<React.ComponentProps<typeof Base.Sidebar>, "collapsible" | "variant"> {
	heading: string;
	userName?: string;
	userEmail?: string;
}

export function Sidebar({
	heading,
	userName,
	userEmail,
	...props
}: SidebarProps) {
	const {
		state,
		isMobile,
		toggleSidebar,
	} = Base.useSidebar();

	return (
		<Base.Sidebar
			variant="sidebar"
			collapsible="icon"
			{...props}
		>
			<Base.SidebarHeader>
				<Base.SidebarMenu>
					{
						isMobile || state !== "collapsed"
						? (
							<Base.SidebarMenuItem>
								<Base.SidebarMenuButton
									size="lg"
									className="px-0.5 bg-transparent!"
									render={<div/>}
								>
									<Link to="/" className="contents">
										<Logo/>
										<h2 className="truncate font-semibold">
											{heading}
										</h2>
									</Link>
								</Base.SidebarMenuButton>
								<Base.SidebarMenuAction
									className="group/menu-action cursor-pointer size-8 translate-x-0.5 -translate-y-0.5"
									onClick={toggleSidebar}
								>
									<PanelLeft className="absolute opacity-100 group-hover/menu-action:opacity-0 group-focus-within/menu-action:opacity-0"/>
									<PanelLeftClose className="absolute opacity-0 group-hover/menu-action:opacity-100 group-focus-within/menu-action:opacity-100"/>
								</Base.SidebarMenuAction>
							</Base.SidebarMenuItem>
						)
						: (
							<Base.SidebarMenuItem>
								<Base.SidebarMenuButton
									tooltip="Sidebar Open"
									className="group-data-[collapsible=icon]:p-0.5! items-center-safe justify-center-safe cursor-pointer"
									onClick={toggleSidebar}
								>
									<Logo className="opacity-100 group-hover/menu-button:opacity-0 group-focus-within/menu-button:opacity-0"/>
									<PanelLeftOpen className="absolute opacity-0 group-hover/menu-button:opacity-100 group-focus-within/menu-button:opacity-100"/>
								</Base.SidebarMenuButton>
							</Base.SidebarMenuItem>
						)
					}
				</Base.SidebarMenu>
			</Base.SidebarHeader>
			<Base.SidebarContent>
				<Base.SidebarGroup>
					<Base.SidebarGroupLabel>Platform</Base.SidebarGroupLabel>
					<Base.SidebarMenu>
						<Collapsible className="group/collapsible" defaultOpen>
							<Base.SidebarMenuItem>
								<CollapsibleTrigger
									render={<Base.SidebarMenuButton tooltip="Playground" className="cursor-pointer"/>}
								>
									<TerminalSquare/>
									<span>Playground</span>
									<ChevronRight className="ml-auto transition-transform group-data-open/collapsible:rotate-90"/>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<Base.SidebarMenuSub>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>History</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>Starred</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>Settings</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
									</Base.SidebarMenuSub>
								</CollapsibleContent>
							</Base.SidebarMenuItem>
						</Collapsible>
						<Collapsible className="group/collapsible">
							<Base.SidebarMenuItem>
								<CollapsibleTrigger
									render={<Base.SidebarMenuButton tooltip="Models" className="cursor-pointer"/>}
								>
									<Bot/>
									<span>Models</span>
									<ChevronRight className="ml-auto transition-transform group-data-open/collapsible:rotate-90"/>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<Base.SidebarMenuSub>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>Genesis</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>Explorer</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>Quantum</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
									</Base.SidebarMenuSub>
								</CollapsibleContent>
							</Base.SidebarMenuItem>
						</Collapsible>
						<Collapsible className="group/collapsible">
							<Base.SidebarMenuItem>
								<CollapsibleTrigger
									render={<Base.SidebarMenuButton tooltip="Documentation" className="cursor-pointer"/>}
								>
									<BookOpen/>
									<span>Documentation</span>
									<ChevronRight className="ml-auto transition-transform group-data-open/collapsible:rotate-90"/>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<Base.SidebarMenuSub>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>Introduction</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>Get Started</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>Tutorial</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>Changelog</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
									</Base.SidebarMenuSub>
								</CollapsibleContent>
							</Base.SidebarMenuItem>
						</Collapsible>
						<Collapsible className="group/collapsible">
							<Base.SidebarMenuItem>
								<CollapsibleTrigger
									render={<Base.SidebarMenuButton tooltip="Settings" className="cursor-pointer"/>}
								>
									<Settings2/>
									<span>Settings</span>
									<ChevronRight className="ml-auto transition-transform group-data-open/collapsible:rotate-90"/>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<Base.SidebarMenuSub>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>General</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>Team</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>Billing</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
										<Base.SidebarMenuSubItem>
											<Base.SidebarMenuSubButton href="#" className="cursor-pointer">
												<span>Limits</span>
											</Base.SidebarMenuSubButton>
										</Base.SidebarMenuSubItem>
									</Base.SidebarMenuSub>
								</CollapsibleContent>
							</Base.SidebarMenuItem>
						</Collapsible>
					</Base.SidebarMenu>
				</Base.SidebarGroup>
				<Base.SidebarGroup>
					<Base.SidebarGroupLabel>Projects</Base.SidebarGroupLabel>
					<Base.SidebarMenu>
						<Base.SidebarMenuItem>
							<DropdownMenu>
								<Base.SidebarMenuButton tooltip="Design Engineering" className="cursor-pointer">
									<Frame/>
									<span>Design Engineering</span>
								</Base.SidebarMenuButton>
								<DropdownMenuTrigger
									render={<Base.SidebarMenuAction
										showOnHover
										className="cursor-pointer"
									/>}
								>
									<Ellipsis/>
									<span className="sr-only">More</span>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									side={isMobile ? "bottom" : "right"}
									align="end"
									className="w-48"
								>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<Folder/>}
									>View Project</DropdownMenuItem>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<Forward/>}
									>Share Project</DropdownMenuItem>
									<DropdownMenuSeparator/>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<Trash2/>}
									>Delete Project</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</Base.SidebarMenuItem>
						<Base.SidebarMenuItem>
							<DropdownMenu>
								<Base.SidebarMenuButton tooltip="Sales & Marketing" className="cursor-pointer">
									<ChartPie/>
									<span>Sales & Marketing</span>
								</Base.SidebarMenuButton>
								<DropdownMenuTrigger
									render={<Base.SidebarMenuAction
										showOnHover
										className="cursor-pointer"
									/>}
								>
									<Ellipsis/>
									<span className="sr-only">More</span>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									side={isMobile ? "bottom" : "right"}
									align="end"
									className="w-48"
								>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<Folder/>}
									>View Project</DropdownMenuItem>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<Forward/>}
									>Share Project</DropdownMenuItem>
									<DropdownMenuSeparator/>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<Trash2/>}
									>Delete Project</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</Base.SidebarMenuItem>
						<Base.SidebarMenuItem>
							<DropdownMenu>
								<Base.SidebarMenuButton tooltip="Travel" className="cursor-pointer">
									<Map/>
									<span>Travel</span>
								</Base.SidebarMenuButton>
								<DropdownMenuTrigger
									render={<Base.SidebarMenuAction
										showOnHover
										className="cursor-pointer"
									/>}
								>
									<Ellipsis/>
									<span className="sr-only">More</span>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									side={isMobile ? "bottom" : "right"}
									align="end"
									className="w-48"
								>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<Folder/>}
									>View Project</DropdownMenuItem>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<Forward/>}
									>Share Project</DropdownMenuItem>
									<DropdownMenuSeparator/>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<Trash2/>}
									>Delete Project</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</Base.SidebarMenuItem>
						<Base.SidebarMenuItem>
							<Base.SidebarMenuButton tooltip="More" className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/70 cursor-pointer">
								<Ellipsis/>
								<span>More</span>
							</Base.SidebarMenuButton>
						</Base.SidebarMenuItem>
					</Base.SidebarMenu>
				</Base.SidebarGroup>
			</Base.SidebarContent>
			<Base.SidebarFooter>
				<Base.SidebarMenu>
					<Base.SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={<Base.SidebarMenuButton
									size="lg"
									className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground cursor-pointer"
								/>}
							>
								<Avatar size="default">
									<AvatarImage src="https://ui.shadcn.com/avatars/shadcn.jpg"/>
								</Avatar>
								<MenuItemGroup
									label={userName}
									description={userEmail}
								/>
								<ChevronsUpDown/>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								side={isMobile ? "bottom" : "right"}
								align="end"
								className="w-full min-w-56"
							>
								<DropdownMenuGroup>
									<DropdownMenuLabel className="p-0 font-normal">
										<div className="flex items-center-safe gap-2 px-1 py-1.5 text-left text-sm">
										<Avatar size="default">
											<AvatarImage src="https://ui.shadcn.com/avatars/shadcn.jpg"/>
										</Avatar>
										<MenuItemGroup
											label={userName}
											description={userEmail}
										/>
									</div>
									</DropdownMenuLabel>
								</DropdownMenuGroup>
								<DropdownMenuSeparator/>
								<DropdownMenuGroup>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<Sparkles/>}
									>Upgrade to Pro</DropdownMenuItem>
								</DropdownMenuGroup>
								<DropdownMenuSeparator/>
								<DropdownMenuGroup>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<BadgeCheck/>}
									>Account</DropdownMenuItem>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<CreditCard/>}
									>Billing</DropdownMenuItem>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<Bell/>}
									>Notifications</DropdownMenuItem>
								</DropdownMenuGroup>
								<DropdownMenuSeparator/>
								<DropdownMenuGroup>
									<DropdownMenuItem
										className="cursor-pointer"
										icon={<LogOut/>}
									>Log out</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</Base.SidebarMenuItem>
				</Base.SidebarMenu>
			</Base.SidebarFooter>
		</Base.Sidebar>
	);
}
