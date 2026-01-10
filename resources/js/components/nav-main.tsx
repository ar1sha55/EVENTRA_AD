import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { type MainNavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function NavMain({ items = [] }: { items: MainNavItem[] }) {
    const page = usePage();
    const currentPath = page.url.split('?')[0]; // Remove query params for comparison

    // Check if a path is currently active
    const isPathActive = (href: string | undefined) => {
        if (!href) return false;
        // Exact match or starts with (for nested routes)
        return currentPath === href || currentPath.startsWith(href + '/');
    };

    // Check if any subItem is active (to keep parent expanded)
    const hasActiveSubItem = (subItems: MainNavItem['subItems']) => {
        if (!subItems) return false;
        return subItems.some(subItem => isPathActive(subItem.href));
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel></SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) =>
                    item.subItems && item.subItems.length > 0 ? (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={item.isActive || hasActiveSubItem(item.subItems) || !!page.props.auth.user}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        className={cn(
                                            hasActiveSubItem(item.subItems) && "bg-primary/5 font-medium"
                                        )}
                                    >
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.subItems?.map((subItem) => {
                                            const isActive = isPathActive(subItem.href);
                                            return (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        className={cn(
                                                            isActive && "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                                                        )}
                                                    >
                                                        <Link href={subItem.href}>
                                                            {subItem.icon && (
                                                                <subItem.icon className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    isActive && "text-primary"
                                                                )} />
                                                            )}
                                                            <span>{subItem.title}</span>
                                                            {subItem.badge && subItem.badge > 0 && (
                                                                <Badge variant="default" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs">
                                                                    {subItem.badge > 99 ? '99+' : subItem.badge}
                                                                </Badge>
                                                            )}
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            );
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                className={cn(
                                    isPathActive(item.href) && "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                                )}
                            >
                                <Link href={item.href ?? '#'}>
                                    {item.icon && <item.icon className={cn(
                                        isPathActive(item.href) && "text-primary"
                                    )} />}
                                    <span>{item.title}</span>
                                    {item.badge && item.badge > 0 && (
                                        <Badge variant="default" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs">
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </Badge>
                                    )}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ),
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}