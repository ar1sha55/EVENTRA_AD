import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Shield,
    Users,
    Calendar,
    LifeBuoy,
    TrendingUp,
    Database,
    Settings,
    History,
    UserCog,
    BarChart3,
    Activity,
    ArrowUpRight,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

interface DashboardStats {
    totalUsers: number;
    totalAdmins: number;
    totalManagers: number;
    totalMembers: number;
    totalEvents: number;
    activeEvents: number;
    pastEvents: number;
    totalSupportTickets: number;
    openTickets: number;
    resolvedTickets: number;
    recentActivities: Array<{
        id: number;
        description: string;
        user: string;
        time: string;
        type: string;
    }>;
    userGrowthData: Array<{
        month: string;
        users: number;
    }>;
    eventStatusData: Array<{
        name: string;
        value: number;
    }>;
    ticketStatusData: Array<{
        name: string;
        value: number;
    }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number;
        name: string;
        payload: { name: string; value: number };
    }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border rounded-lg shadow-lg p-3">
                <p className="font-semibold">{payload[0].payload.name}</p>
                <p className="text-sm text-muted-foreground">
                    Count: <span className="font-medium text-foreground">{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get('/api/admin/dashboard/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={[{ title: 'Admin Dashboard', href: '/admin/dashboard' }]}>
                <Head title="Admin Dashboard" />
                <div className="container mx-auto p-6">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <Shield className="h-12 w-12 text-muted-foreground animate-pulse mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading dashboard...</p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin Dashboard', href: '/admin/dashboard' }]}>
            <Head title="Admin Dashboard" />
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                            <p className="text-muted-foreground">
                                System-wide overview and administration
                            </p>
                        </div>
                    </div>
                </div>

                {/* Statistics Overview Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="transition-all hover:shadow-md border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                    {stats?.totalAdmins || 0} admins
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                    {stats?.totalManagers || 0} managers
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats?.totalMembers || 0} members registered
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="transition-all hover:shadow-md border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                                <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats?.totalEvents || 0}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs text-muted-foreground">
                                        {stats?.activeEvents || 0} active
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        {stats?.pastEvents || 0} completed
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="transition-all hover:shadow-md border-l-4 border-l-orange-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
                            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                                <LifeBuoy className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats?.totalSupportTickets || 0}</div>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 text-orange-500" />
                                    <span className="text-xs text-muted-foreground">
                                        {stats?.openTickets || 0} pending
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-muted-foreground">
                                        {stats?.resolvedTickets || 0} resolved
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="transition-all hover:shadow-md border-l-4 border-l-emerald-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Health</CardTitle>
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                                <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="text-2xl font-bold text-emerald-600">Healthy</div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                All systems operational
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* User Growth Chart */}
                    <Card className="col-span-2 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-blue-500" />
                                        User Growth Trend
                                    </CardTitle>
                                    <CardDescription>Monthly user registration over the last 6 months</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={stats?.userGrowthData || []}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="month"
                                        className="text-xs"
                                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <YAxis
                                        className="text-xs"
                                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorUsers)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Event Status Distribution */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-green-500" />
                                Event Status
                            </CardTitle>
                            <CardDescription>Distribution of event statuses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={stats?.eventStatusData || []}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry: { name: string; percent: number }) =>
                                            `${entry.name} ${(entry.percent * 100).toFixed(0)}%`
                                        }
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {(stats?.eventStatusData || []).map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions & Recent Activity */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Quick Actions */}
                    <Card className="col-span-2 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-purple-500" />
                                Quick Actions
                            </CardTitle>
                            <CardDescription>Common administrative tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Button
                                    variant="outline"
                                    className="h-auto justify-start text-left p-4 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                                    onClick={() => router.get('/admin/manage-users')}
                                >
                                    <div className="flex items-start gap-3 w-full">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:scale-110 transition-transform">
                                            <UserCog className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm flex items-center gap-1">
                                                Manage Users
                                                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                View and manage all accounts
                                            </span>
                                        </div>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto justify-start text-left p-4 hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-200 dark:hover:border-purple-800 transition-all group"
                                    onClick={() => router.get('/admin/audit-trail')}
                                >
                                    <div className="flex items-start gap-3 w-full">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:scale-110 transition-transform">
                                            <History className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm flex items-center gap-1">
                                                Audit Trail
                                                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                View system activity history
                                            </span>
                                        </div>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto justify-start text-left p-4 hover:bg-orange-50 dark:hover:bg-orange-950 hover:border-orange-200 dark:hover:border-orange-800 transition-all group"
                                    onClick={() => router.get('/admin/support-tickets')}
                                >
                                    <div className="flex items-start gap-3 w-full">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg group-hover:scale-110 transition-transform">
                                            <LifeBuoy className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm flex items-center gap-1">
                                                Support Tickets
                                                {stats && stats.openTickets > 0 && (
                                                    <Badge variant="destructive" className="ml-auto text-xs">
                                                        {stats.openTickets}
                                                    </Badge>
                                                )}
                                                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                Manage user support requests
                                            </span>
                                        </div>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto justify-start text-left p-4 hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-200 dark:hover:border-green-800 transition-all group"
                                    onClick={() => router.get('/manager/manage-analytics')}
                                >
                                    <div className="flex items-start gap-3 w-full">
                                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg group-hover:scale-110 transition-transform">
                                            <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm flex items-center gap-1">
                                                Analytics & Reports
                                                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                View detailed analytics
                                            </span>
                                        </div>
                                    </div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5 text-indigo-500" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription>Latest system events</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                                    stats.recentActivities.map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex-shrink-0 mt-1">
                                                {activity.type === 'user' ? (
                                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-full">
                                                        <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                ) : activity.type === 'event' ? (
                                                    <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-full">
                                                        <Calendar className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                    </div>
                                                ) : activity.type === 'ticket' ? (
                                                    <div className="p-1.5 bg-orange-100 dark:bg-orange-900 rounded-full">
                                                        <LifeBuoy className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                                    </div>
                                                ) : (
                                                    <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                                        <Activity className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm leading-tight line-clamp-2">
                                                    {activity.description}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {activity.user}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {activity.time}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                        <p className="text-sm text-muted-foreground">
                                            No recent activity
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
