import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type MainNavItem, NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {     
    BookOpen, 
    Folder, 
    Shield, 
    Settings, 
    LayoutGrid,
    Users,
    Calendar,
    Bell,
    MessageCircle,
    ScanLine,
    ClipboardList,
    BarChart3,
    MessageSquare,
    FileText,
    User,
    LogOut,
    Images,
    CalendarDays,
    Headphones,
} from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage().props;
    const userRole = auth?.user?.role || 'user';

    // Base navigation for regular users
    const mainNavItems: MainNavItem[] = [
        {   title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
            isActive:false,
        },

        {
            title: 'Events',
            icon: CalendarDays,
            subItems: [
                {title: 'Join Events',
            href: '/join-events',
            icon: Calendar,},
            {
            title: 'Events Gallery',
            href: '/events-gallery',
            icon: Images,
        },
        {
            title: 'Announcement',
            href: '/announcement',
            icon: Bell,
        },
            ]
        },
        {
            title: 'Support',
            icon: Headphones,
            subItems: [
        {
            title: 'Contact Support',
            href: '/contact-support',
            icon: MessageCircle,
        },]},
    ];

    // Manager-specific navigation
    const managerNavItems: MainNavItem[] = [
        {   title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
            isActive:false,
        },

        {
            title: 'Member Management',
            icon: Users,
            subItems: [
                {title: 'Manage Members',
            href: '/manager/manage-members',
            icon: Users,},
            {
            title: 'Event Blast',
            href: '/manager/event-blast',
            icon: MessageSquare,
        },],
        },
            {
            title: 'Events Management',
            icon: ClipboardList,
            subItems: [
            {
            title: 'Manage Events',
            href: '/manager/manage-events',
            icon: ClipboardList,                
            },

            {
            title: 'Analytics & Reports',
            href: '/manager/manage-analytics',
            icon: BarChart3,
            },

            {
            title: 'Send Announcement',
            href: '/manager/send-announcement',
            icon: Bell,
            },
            
            ],
        },

        
    ];

    // Admin-specific navigation
    const adminNavItems: MainNavItem[] = [
        {
            title: 'System Control',
            href: '/admin/system-control',
            icon: Shield,
            isActive: false,
        },
    ];

    // Compute navigation items based on role
    let roleBasedNavItems = [...mainNavItems];
    if (userRole === 'manager') {
        roleBasedNavItems = [...managerNavItems];
    }
    if (userRole === 'admin') {
        roleBasedNavItems = [...managerNavItems, ...adminNavItems];
    }

    const footerNavItems: NavItem[] = [
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={roleBasedNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}