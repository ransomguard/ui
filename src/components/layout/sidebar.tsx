import { Link, NavLink, useResolvedPath, useMatch } from "react-router";
import {
	PanelLeft,
	PanelLeftOpen,
	PanelLeftClose,
	ChevronsUpDown,
	ChevronRight,
	Ellipsis,
	LogIn,
	type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { FlattenedKeys } from "@/locales";

import * as Base from "@/components/ui/sidebar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
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
import { I18n, type I18nProps } from "@/components/i18n";
import { Logo } from "@/components/logo";



type SidebarI18nKey = FlattenedKeys<"sidebar">;
type NavI18nKey = FlattenedKeys<"nav">;

interface SidebarI18nProps extends Omit<I18nProps<"sidebar">, "prefix"> {
}

function SidebarI18n(props: SidebarI18nProps) {
	return (
		<I18n
			prefix="sidebar"
			{...props}
		/>
	);
}

interface NavI18nProps extends Omit<I18nProps<"nav">, "prefix"> {
}

function NavI18n(props: NavI18nProps) {
	return (
		<I18n
			prefix="nav"
			{...props}
		/>
	);
}



export const SidebarProvider = Base.SidebarProvider;
export interface SidebarProviderProps extends React.ComponentProps<typeof Base.SidebarProvider> {
}

export const SidebarTrigger = Base.SidebarTrigger;
export interface SidebarTriggerProps extends React.ComponentProps<typeof Base.SidebarTrigger> {
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSidebar = Base.useSidebar;



export interface SidebarUserMenuItem {
	id?: string;
	label: SidebarI18nKey;
	icon?: LucideIcon;
	shortcut?: string;
	onClick?: () => void;
	separatorAfter?: boolean;
}

export interface SidebarNavSubItem {
	label: NavI18nKey;
	href?: string;
	icon?: LucideIcon;
	onClick?: () => void;
}

export interface SidebarNavItem {
	label: NavI18nKey;
	href?: string;
	icon?: LucideIcon;
	tooltip?: NavI18nKey;
	defaultOpen?: boolean;
	items?: SidebarNavSubItem[];
	actions?: {
		icon?: LucideIcon;
		onClick?: () => void;
		menuItems?: {
			label: NavI18nKey;
			icon?: LucideIcon;
			onClick?: () => void;
			separatorAfter?: boolean;
		}[];
	};
	onClick?: () => void;
}

export interface SidebarNavGroup {
	label?: NavI18nKey;
	items: SidebarNavItem[];
}

export interface SidebarUserProfile {
	email: string;
	name?: string;
	avatar?: string;
}



interface DropdownMenuItemProps extends React.ComponentProps<typeof BaseDropdownMenuItem> {
	icon?: LucideIcon;
	shortcut?: string;
}

function DropdownMenuItem({
	icon: Icon,
	shortcut,
	children,
	...props
}: DropdownMenuItemProps) {
	return (
		<BaseDropdownMenuItem {...props}>
			{Icon && <Icon/>}
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
			<span className="truncate text-xs text-muted-foreground">{description}</span>
		</div>
	);
}



const isExternalUrl = (href?: string) => Boolean(href && (href.startsWith("http://") || href.startsWith("https://")));
const externalProps = {
	target: "_blank",
	rel: "noopener noreferrer",
};

function RenderNavMenuButton({
	item: {
		href,
		tooltip: _tooltip,
		label,
		onClick,
	},
	children,
}: {
	item: SidebarNavItem;
	children: React.ReactNode;
}) {
	const resolvedHref = useResolvedPath(href ?? "");
	const isActive = useMatch({ path: resolvedHref.pathname });

	const tooltip = _tooltip ?? label;
	const commonProps = {
		tooltip: {
			children: <NavI18n i18nKey={tooltip}/>,
		},
		className: "cursor-pointer",
		onClick: onClick,
		children,
	};

	if (href) {
		const isExternal = isExternalUrl(href);
		const linkProps = !isExternal ? {} : externalProps;

		return (
			<Base.SidebarMenuButton
				isActive={!!isActive}
				{...linkProps}
				{...commonProps}
				render={<NavLink to={href}/>}
			/>
		);
	}

	return (
		<Base.SidebarMenuButton
			{...commonProps}
		/>
	);
}

function RenderNavMenuSubButton({
	item: {
		icon: Icon,
		label,
		href,
		onClick,
	},
}: {
	item: SidebarNavSubItem;
}) {
	const resolvedHref = useResolvedPath(href ?? "");
	const isActive = useMatch({ path: resolvedHref.pathname });

	const commonProps = {
		className: "cursor-pointer",
		onClick: onClick,
		children: <>
			{Icon && <Icon/>}
			<NavI18n i18nKey={label}/>
		</>,
	};

	if (href) {
		const isExternal = isExternalUrl(href);
		const linkProps = !isExternal ? {} : externalProps;

		return (
			<Base.SidebarMenuSubButton
				isActive={!!isActive}
				{...linkProps}
				{...commonProps}
				render={<NavLink to={href}/>}
			/>
		);
	}

	return (
		<Base.SidebarMenuSubButton
			{...commonProps}
			render={<button type="button"/>}
		/>
	);
}



export interface SidebarProps extends Omit<React.ComponentProps<typeof Base.Sidebar>, "collapsible" | "variant"> {
	logo?: React.ReactNode;
	heading: string;
	openText: string;
	closeText: string;
	navGroups?: SidebarNavGroup[];

	enableUserMenu?: boolean;
	loginText?: string;
	user?: SidebarUserProfile;
	userMenuItems?: SidebarUserMenuItem[];
}

const DEFAULT_AVATAR = "https://ui.shadcn.com/avatars/shadcn.jpg";

export function Sidebar({
	logo = <Logo/>,
	heading,
	openText,
	closeText,
	navGroups = [],
	user: _user,
	enableUserMenu,
	loginText,
	userMenuItems = [],
	...props
}: SidebarProps) {
	const {
		state,
		isMobile,
		toggleSidebar,
	} = Base.useSidebar();

	const user = !_user?.email ? null : {
		email: _user.email,
		name: _user.name ?? _user.email.split("@")[0],
		avatar: _user.avatar ?? DEFAULT_AVATAR,
	};

	return (
		<Base.Sidebar
			variant="sidebar"
			collapsible="icon"
			{...props}
		>
			<Base.SidebarHeader>
				<Base.SidebarMenu>
					{isMobile || state !== "collapsed" ? (
						<Base.SidebarMenuItem>
							<Base.SidebarMenuButton
								size="lg"
								className="px-0.5 bg-transparent!"
								render={<div/>}
							>
								<Link to="/" className="contents">
									{logo}
									<h2 className="truncate font-semibold">
										{heading}
									</h2>
								</Link>
							</Base.SidebarMenuButton>
							<Base.SidebarMenuAction
								aria-label={closeText}
								className="group/menu-action cursor-pointer size-8 translate-x-0.5 -translate-y-0.5"
								onClick={toggleSidebar}
							>
								<PanelLeft className="absolute opacity-100 group-hover/menu-action:opacity-0 group-focus-within/menu-action:opacity-0"/>
								<PanelLeftClose className="absolute opacity-0 group-hover/menu-action:opacity-100 group-focus-within/menu-action:opacity-100"/>
							</Base.SidebarMenuAction>
						</Base.SidebarMenuItem>
					) : (
						<Base.SidebarMenuItem>
							<Base.SidebarMenuButton
								tooltip={openText}
								className="group-data-[collapsible=icon]:p-0.5! items-center-safe justify-center-safe cursor-pointer"
								onClick={toggleSidebar}
							>
								<div className="opacity-100 group-hover/menu-button:opacity-0 group-focus-within/menu-button:opacity-0">
									{logo}
								</div>
								<PanelLeftOpen className="absolute opacity-0 group-hover/menu-button:opacity-100 group-focus-within/menu-button:opacity-100"/>
							</Base.SidebarMenuButton>
						</Base.SidebarMenuItem>
					)}
				</Base.SidebarMenu>
			</Base.SidebarHeader>

			<Base.SidebarContent>
				{navGroups.map((group, groupIdx) => (
					<Base.SidebarGroup key={group.label ?? `group-${groupIdx}`}>
						{group.label && (
							<NavI18n
								i18nKey={group.label}
								render={<Base.SidebarGroupLabel/>}
							/>
						)}
						<Base.SidebarMenu>
							{group.items.map((item) => {
								const hasSubItems = Boolean(item.items && item.items.length > 0);
								const hasActions = Boolean(item.actions?.menuItems && item.actions.menuItems.length > 0);

								if (hasSubItems) {
									return (
										<Collapsible
											key={item.label}
											className="group/collapsible"
											defaultOpen={item.defaultOpen}
										>
											<Base.SidebarMenuItem>
												<CollapsibleTrigger
													render={
														<Base.SidebarMenuButton
															tooltip={{
																children: <NavI18n i18nKey={item.tooltip ?? item.label}/>,
															}}
															className="cursor-pointer"
														/>
													}
												>
													{item.icon && <item.icon/>}
													<NavI18n i18nKey={item.label}/>
													<ChevronRight className="ml-auto transition-transform group-data-open/collapsible:rotate-90"/>
												</CollapsibleTrigger>
												<CollapsibleContent>
													<Base.SidebarMenuSub>
														{item.items?.map((subItem) => (
															<Base.SidebarMenuSubItem key={subItem.label}>
																<RenderNavMenuSubButton item={subItem}/>
															</Base.SidebarMenuSubItem>
														))}
													</Base.SidebarMenuSub>
												</CollapsibleContent>
											</Base.SidebarMenuItem>
										</Collapsible>
									);
								}

								if (hasActions) {
									return (
										<Base.SidebarMenuItem key={item.label}>
											<DropdownMenu>
												<RenderNavMenuButton item={item}>
													{item.icon && <item.icon/>}
													<NavI18n i18nKey={item.label}/>
												</RenderNavMenuButton>
												<DropdownMenuTrigger
													render={
														<Base.SidebarMenuAction
															showOnHover
															className="cursor-pointer"
														/>
													}
												>
													{item.actions?.icon ? <item.actions.icon/> : <Ellipsis/>}
													<span className="sr-only">More</span>
												</DropdownMenuTrigger>
												<DropdownMenuContent
													side={isMobile ? "bottom" : "right"}
													align="end"
													className="w-48"
												>
													{item.actions?.menuItems?.map((actionItem) => (
														<div key={actionItem.label}>
															<DropdownMenuItem
																className="cursor-pointer"
																icon={actionItem.icon}
																onClick={actionItem.onClick}
															>
																<NavI18n i18nKey={actionItem.label}/>
															</DropdownMenuItem>
															{actionItem.separatorAfter && <DropdownMenuSeparator/>}
														</div>
													))}
												</DropdownMenuContent>
											</DropdownMenu>
										</Base.SidebarMenuItem>
									);
								}

								return (
									<Base.SidebarMenuItem key={item.label}>
										<RenderNavMenuButton item={item}>
											{item.icon && <item.icon/>}
											<NavI18n i18nKey={item.label}/>
										</RenderNavMenuButton>
									</Base.SidebarMenuItem>
								);
							})}
						</Base.SidebarMenu>
					</Base.SidebarGroup>
				))}
			</Base.SidebarContent>

			{enableUserMenu && (
				<Base.SidebarFooter>
					<Base.SidebarMenu>
						<Base.SidebarMenuItem>
						{
							!user?.email
							? (
								<Base.SidebarMenuButton
									tooltip={loginText}
									className="cursor-pointer"
								>
									<LogIn className="not-group-data-[collapsible=icon]:hidden"/>
									<span className="w-full text-center font-medium">{loginText}</span>
								</Base.SidebarMenuButton>
							)
							: (
								<DropdownMenu>
									<DropdownMenuTrigger
										render={
											<Base.SidebarMenuButton
												size="lg"
												className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground cursor-pointer"
											/>
										}
									>
										<Avatar size="default">
											<AvatarImage src={user.avatar}/>
										</Avatar>
										<MenuItemGroup
											label={user.name}
											description={user.email}
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
														<AvatarImage src={user.avatar}/>
													</Avatar>
													<MenuItemGroup
														label={user.name}
														description={user.email}
													/>
												</div>
											</DropdownMenuLabel>
										</DropdownMenuGroup>
										<DropdownMenuSeparator/>
										{userMenuItems.map((item) => (
											<div key={item.id ?? item.label}>
												<DropdownMenuItem
													className="cursor-pointer"
													icon={item.icon}
													shortcut={item.shortcut}
													onClick={item.onClick}
												>
													<SidebarI18n i18nKey={item.label}/>
												</DropdownMenuItem>
												{item.separatorAfter && <DropdownMenuSeparator/>}
											</div>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							)
						}
						</Base.SidebarMenuItem>
					</Base.SidebarMenu>
				</Base.SidebarFooter>
			)}
		</Base.Sidebar>
	);
}
