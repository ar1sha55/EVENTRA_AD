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
    LayoutDashboard,
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
    History,
    LifeBuoy,
} from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import AppLogo from './app-logo';
import { useRoleSwitcher } from '@/hooks/use-role-switcher';

export function AppSidebar() {
    const { auth } = usePage().props;
    const actualRole = auth?.user?.role || 'user';
    const { selectedView } = useRoleSwitcher();

    // Use selectedView for admins, actualRole for others
    const effectiveRole = actualRole === 'admin' ? selectedView : actualRole;

    // Member-only navigation (regular members)
    const memberOnlyNavItems = [
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
                { title: 'My Tickets', href: '/support-history', icon: History },
            ],
        },
    ];

    // Personal events navigation (for managers/admins)
    const myEventsNavItem = {
        title: 'My Events',
        icon: CalendarDays,
        subItems: [
            { title: 'My Dashboard', href: '/dashboard', icon: LayoutGrid },
            { title: 'Join Events', href: '/join-events', icon: Calendar },
            { title: 'Events Gallery', href: '/events-gallery', icon: Images },
            { title: 'Announcement', href: '/announcement', icon: Bell },
        ],
    };

    const supportNavItem = {
        title: 'Support',
        icon: Headphones,
        subItems: [
            { title: 'Contact Support', href: '/contact-support', icon: Headphones },
            { title: 'My Tickets', href: '/support-history', icon: History },
        ],
    };

    // Manager-specific navigation
    const managerNavItems = [
        {
            title: 'Dashboard',
            href: '/manager/dashboard',
            icon: LayoutDashboard,
        },
        myEventsNavItem,
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
        supportNavItem,
    ];

    // Admin-only navigation (complete navigation for admins)
    const adminNavItems = [
        {
            title: 'Dashboard',
            href: '/admin/dashboard',
            icon: Shield,
        },
        myEventsNavItem,
        {
            title: 'Management',
            icon: LayoutDashboard,
            subItems: [
                { title: 'Manager Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
                { title: 'Manage Members', href: '/manager/manage-members', icon: Users },
                { title: 'Event Blast', href: '/manager/event-blast', icon: MessageSquare },
                { title: 'Manage Events', href: '/events', icon: ClipboardList },
                { title: 'Analytics & Reports', href: '/manager/manage-analytics', icon: BarChart3 },
                { title: 'Send Announcement', href: '/manager/send-announcement', icon: Bell },
            ],
        },
        {
            title: 'Manage Users',
            href: '/admin/manage-users',
            icon: Users,
        },
        {
            title: 'Activity Logs',
            href: '/admin/activity-logs',
            icon: History,
        },
        {
            title: 'Support Tickets',
            href: '/admin/support-tickets',
            icon: LifeBuoy,
        },
        supportNavItem,
    ];

    // Compute navigation items based on effective role
    let roleBasedNavItems: any[] = [];

    if (effectiveRole === 'member') {
        // Regular members see simple navigation
        roleBasedNavItems = [...memberOnlyNavItems];
    } else if (effectiveRole === 'manager') {
        // Managers see dashboard + My Events + management features
        roleBasedNavItems = [...managerNavItems];
    } else if (effectiveRole === 'admin') {
        // Admins see complete admin navigation
        roleBasedNavItems = [...adminNavItems];
    }

    const footerNavItems: any[] = []; // You can add footer links here if needed

    // Determine home dashboard based on effective role
    const homeDashboard = effectiveRole === 'admin'
        ? '/admin/dashboard'
        : effectiveRole === 'manager'
        ? '/manager/dashboard'
        : '/dashboard';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeDashboard}>
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
