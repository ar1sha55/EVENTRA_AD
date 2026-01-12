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
    Clock,
    ClipboardList,
    MessageSquare
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
    totalRegistrations: number;
    approvedRegistrations: number;
    pendingRegistrations: number;
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">
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
                            <div className="text-2xl sm:text-3xl font-bold">{stats?.totalUsers || 0}</div>
                            <div className="flex flex-col gap-1.5 mt-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Admins</span>
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                        {stats?.totalAdmins || 0}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Managers</span>
                                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                        {stats?.totalManagers || 0}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Members</span>
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                        {stats?.totalMembers || 0}
                                    </Badge>
                                </div>
                            </div>
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

                    <Card className="transition-all hover:shadow-md border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                                <ClipboardList className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl sm:text-3xl font-bold">{stats?.totalRegistrations || 0}</div>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-muted-foreground">
                                        {stats?.approvedRegistrations || 0} approved
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-orange-500" />
                                    <span className="text-xs text-muted-foreground">
                                        {stats?.pendingRegistrations || 0} pending
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* User Growth Chart */}
                    <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                                        User Growth Trend
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Monthly user registration over the last 6 months</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full h-[220px] sm:h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={stats?.userGrowthData || []}
                                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            className="text-xs"
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                            dy={8}
                                        />
                                        <YAxis
                                            className="text-xs"
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                            allowDecimals={false}
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
                            </div>
                        </CardContent>
                    </Card>

                    {/* Event Status Distribution */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                Event Status
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Distribution of event statuses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full h-[220px] sm:h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats?.eventStatusData || []}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry: { name: string; percent: number; value: number }) => {
                                                // Only show label if value is greater than 0
                                                if (entry.value === 0) return '';
                                                const percentage = (entry.percent * 100).toFixed(0);
                                                // Don't show 0%
                                                if (percentage === '0') return '';
                                                return `${entry.name} ${percentage}%`;
                                            }}
                                            outerRadius={window.innerWidth < 640 ? 60 : 75}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {(stats?.eventStatusData || []).map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value: string, entry: any) => (
                                                <span className="text-xs">{value}: {entry.payload.value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions & Recent Activity */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Quick Actions */}
                    <Card className="lg:col-span-2 shadow-sm flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                                Quick Actions
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Common administrative tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                                <Button
                                    variant="outline"
                                    className="h-auto min-h-[70px] sm:min-h-[80px] justify-start text-left p-3 sm:p-4 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                                    onClick={() => router.get('/admin/manage-users')}
                                >
                                    <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                                        <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                            <UserCog className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-xs sm:text-sm flex items-center gap-1 mb-0.5">
                                                Manage Users
                                                <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs text-muted-foreground block leading-relaxed">
                                                View and manage all accounts
                                            </span>
                                        </div>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto min-h-[70px] sm:min-h-[80px] justify-start text-left p-3 sm:p-4 hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-200 dark:hover:border-purple-800 transition-all group"
                                    onClick={() => router.get('/admin/audit-trail')}
                                >
                                    <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                                        <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                            <History className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-xs sm:text-sm flex items-center gap-1 mb-0.5">
                                                Audit Trail
                                                <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs text-muted-foreground block leading-relaxed">
                                                View system activity history
                                            </span>
                                        </div>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto min-h-[70px] sm:min-h-[80px] justify-start text-left p-3 sm:p-4 hover:bg-orange-50 dark:hover:bg-orange-950 hover:border-orange-200 dark:hover:border-orange-800 transition-all group"
                                    onClick={() => router.get('/admin/support-tickets')}
                                >
                                    <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                                        <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                            <LifeBuoy className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-xs sm:text-sm flex items-center gap-1 mb-0.5">
                                                Support Tickets
                                                {stats && stats.openTickets > 0 && (
                                                    <Badge className="ml-auto text-[9px] sm:text-[10px] bg-orange-500 text-white hover:bg-orange-600 border-orange-600 flex-shrink-0">
                                                        {stats.openTickets}
                                                    </Badge>
                                                )}
                                                <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs text-muted-foreground block leading-relaxed">
                                                Manage user support requests
                                            </span>
                                        </div>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto min-h-[70px] sm:min-h-[80px] justify-start text-left p-3 sm:p-4 hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-200 dark:hover:border-green-800 transition-all group"
                                    onClick={() => router.get('/manager/manage-analytics')}
                                >
                                    <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                                        <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-xs sm:text-sm flex items-center gap-1 mb-0.5">
                                                Analytics & Reports
                                                <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs text-muted-foreground block leading-relaxed">
                                                View detailed analytics
                                            </span>
                                        </div>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto min-h-[70px] sm:min-h-[80px] justify-start text-left p-3 sm:p-4 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
                                    onClick={() => router.get('/events')}
                                >
                                    <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                                        <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                            <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-xs sm:text-sm flex items-center gap-1 mb-0.5">
                                                Manage Events
                                                <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs text-muted-foreground block leading-relaxed">
                                                Create and manage all events
                                            </span>
                                        </div>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto min-h-[70px] sm:min-h-[80px] justify-start text-left p-3 sm:p-4 hover:bg-pink-50 dark:hover:bg-pink-950 hover:border-pink-200 dark:hover:border-pink-800 transition-all group"
                                    onClick={() => router.get('/manager/event-blast')}
                                >
                                    <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                                        <div className="p-1.5 sm:p-2 bg-pink-100 dark:bg-pink-900 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600 dark:text-pink-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-xs sm:text-sm flex items-center gap-1 mb-0.5">
                                                Event Blast
                                                <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs text-muted-foreground block leading-relaxed">
                                                Send mass notifications to participants
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
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <History className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Latest system events</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto">
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
