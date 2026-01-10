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
import { useState, useEffect } from 'react';
import axios from 'axios';

export function AppSidebar() {
    const { auth } = usePage().props;
    const actualRole = auth?.user?.role || 'user';
    const { selectedView } = useRoleSwitcher();
    const [badges, setBadges] = useState<Record<string, number>>({});

    // Use selectedView for admins, actualRole for others
    const effectiveRole = actualRole === 'admin' ? selectedView : actualRole;

    // Fetch sidebar badge counts
    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const response = await axios.get('/api/sidebar-badges');
                setBadges(response.data);
            } catch (error) {
                console.error('Failed to fetch sidebar badges:', error);
            }
        };

        fetchBadges();

        // Refresh badges every 30 seconds
        const interval = setInterval(fetchBadges, 30000);
        return () => clearInterval(interval);
    }, []);

    // Member-only navigation (regular members)
    const memberOnlyNavItems = [
        {
            title: 'My Dashboard',
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
            title: 'Admin Dashboard',
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
            title: 'Audit Trail',
            href: '/admin/audit-trail',
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

    // Attach badges to navigation items
    roleBasedNavItems = roleBasedNavItems.map(item => {
        // Handle items with subItems
        if (item.subItems) {
            const updatedSubItems = item.subItems.map((subItem: any) => {
                if (subItem.href === '/support-history' && badges.my_tickets > 0) {
                    return { ...subItem, badge: badges.my_tickets };
                }
                return subItem;
            });
            return { ...item, subItems: updatedSubItems };
        }

        // Handle top-level items
        if (item.href === '/admin/support-tickets' && badges.support_tickets > 0) {
            return { ...item, badge: badges.support_tickets };
        }
        return item;
    });

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
