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
import {
    LayoutGrid,
    CalendarDays,
    Calendar,
    Images,
    Bell,
    Headphones,
    Users,
    MessageSquare,
    ClipboardList,
    BarChart3,
    Shield,
} from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage().props;
    const userRole = auth?.user?.role || 'user';

    // Base navigation for all users
    const mainNavItems = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Events',
            icon: CalendarDays,
            subItems: [
                { title: 'Join Events', href: '/join-events', icon: Calendar },
                { title: 'Events Gallery', href: '/events-gallery', icon: Images },
                { title: 'Announcement', href: '/announcement', icon: Bell },
            ],
        },
        {
            title: 'Support',
            icon: Headphones,
            subItems: [
                { title: 'Contact Support', href: '/contact-support', icon: Headphones },
            ],
        },
    ];

    // Manager-specific navigation
    const managerNavItems = [
        {
            title: 'Member Management',
            icon: Users,
            subItems: [
                { title: 'Manage Members', href: '/manager/manage-members', icon: Users },
                { title: 'Event Blast', href: '/manager/event-blast', icon: MessageSquare },
            ],
        },
        {
            title: 'Events Management',
            icon: ClipboardList,
            subItems: [
                { title: 'Manage Events', href: '/events', icon: ClipboardList },
                { title: 'Analytics & Reports', href: '/manager/manage-analytics', icon: BarChart3 },
                { title: 'Send Announcement', href: '/manager/send-announcement', icon: Bell },
            ],
        },
    ];

    // Admin-specific navigation
    const adminNavItems = [
        {
            title: 'System Control',
            href: '/admin/system-control',
            icon: Shield,
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

    const footerNavItems: any[] = []; // You can add footer links here if needed

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
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
