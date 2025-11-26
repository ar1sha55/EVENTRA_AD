import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    CalendarDays, 
    Users, 
    CheckCircle, 
    ClipboardList,
    ArrowRight,
    UserPlus,
    Calendar,
    UserCheck,
    Hand,
    Building2,
    Award,
    Clock,
    Mail,
    TrendingUp,
    MapPin,
    PieChart,
    History
} from 'lucide-react';

// --- Types ---
interface DashboardSummary {
    upcoming_events: number;
    completed_events: number;
    total_members: number;
    total_registrations: number;
    pending_registrations: number;
}

interface TopParticipant {
    id: number;
    name: string;
    email: string;
    faculty: string;
    profile_picture?: string;
    total_hours: number;
    events_participated: number;
    participated_events?: Array<{
        id: number;
        name: string;
        date: string;
        hours: number;
    }>;
}

interface DashboardData {
    summary: DashboardSummary;
    participant_status_breakdown: any;
    participants_faculty_distribution: { [key: string]: number };
    upcoming_events: any[];
    recent_notifications: any[];
    member_engagement: { [key: string]: number };
    top_participants: TopParticipant[];
}

interface PageProps {
    auth: { user: { name: string } };
    dashboardData: DashboardData;
}

// --- Helper Components ---

const SummaryCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtext, 
    className,
    titleColor,
    valueColor,
    iconColor
}: { 
    title: string; 
    value: number | string; 
    icon: any; 
    subtext?: React.ReactNode; 
    className: string;
    titleColor: string;
    valueColor: string;
    iconColor: string;
}) => (
    <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${titleColor}`}>
                {title}
            </CardTitle>
            <Icon className={`h-8 w-8 ${iconColor}`} />
        </CardHeader>
        <CardContent>
            <div className={`text-4xl font-bold ${valueColor}`}>
                {value}
            </div>
            {subtext && <div className="mt-1">{subtext}</div>}
        </CardContent>
    </Card>
);

const FacultyDonutChart = ({ 
    data, 
    colors, 
    total 
}: { 
    data: { [key: string]: number }; 
    colors: string[]; 
    total: number; 
}) => {
    if (total === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data available</p>;

    let currentAngle = 0;
    return (
        <div className="flex flex-col items-center gap-6 justify-center pb-2">
            <div className="relative w-48 h-48 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                    {Object.entries(data).map(([key, count], index) => {
                        const percentage = (count / total) * 100;
                        const angle = (percentage / 100) * 360;
                        const largeArc = angle > 180 ? 1 : 0;
                        const r = 40; const cx = 50; const cy = 50;
                        
                        const startX = cx + r * Math.cos((currentAngle * Math.PI) / 180);
                        const startY = cy + r * Math.sin((currentAngle * Math.PI) / 180);
                        const endAngle = currentAngle + angle;
                        const endX = cx + r * Math.cos((endAngle * Math.PI) / 180);
                        const endY = cy + r * Math.sin((endAngle * Math.PI) / 180);
                        
                        const path = percentage >= 99.9 
                            ? `M ${cx} ${cy-r} A ${r} ${r} 0 1 1 ${cx-0.001} ${cy-r}`
                            : `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY} Z`;

                        const color = colors[index % colors.length];
                        currentAngle += angle;

                        return (
                            <path
                                key={key} d={path} fill={color}
                                stroke="white" strokeWidth="0.5"
                            />
                        );
                    })}
                    <circle cx="50" cy="50" r="25" fill="white" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{total}</span>
                    <span className="text-xs text-muted-foreground">Total</span>
                </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-3">
                {Object.entries(data).map(([label, count], index) => {
                    const percentage = Math.round((count / total) * 100);
                    return (
                        <div key={label} className="flex items-start justify-between text-sm gap-3 group">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm mt-1`} style={{ backgroundColor: colors[index % colors.length] }} />
                                <span className="text-gray-700 font-medium break-words" title={label}>
                                    {label}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 text-muted-foreground bg-muted/30 px-2 py-1 rounded-md text-xs">
                                <span className="font-semibold text-gray-900">{count}</span>
                                <span className="w-px h-3 bg-border mx-1"></span>
                                <span>{percentage}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function ManagerDashboard({ dashboardData }: { dashboardData: DashboardData }) {
    const { auth } = usePage().props as unknown as PageProps;
    const [selectedVolunteer, setSelectedVolunteer] = useState<TopParticipant | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!dashboardData) {
        return (
            <AppLayout>
                <Head title="Manager Dashboard" />
                <div className="py-12 flex justify-center"><p>No dashboard data available.</p></div>
            </AppLayout>
        );
    }

    const { 
        summary, 
        participants_faculty_distribution, 
        upcoming_events, 
        recent_notifications, 
        member_engagement,
        top_participants 
    } = dashboardData;

    const totalParticipants = Object.values(participants_faculty_distribution).reduce((sum, val) => sum + val, 0);
    
    const facultyColorsHex = ['#a855f7', '#3b82f6', '#ef4444', '#eab308', '#22c55e', '#ec4899', '#6366f1', '#f97316', '#14b8a6'];
    const engagementColorsHex = ['#a855f7', '#3b82f6', '#eab308', '#22c55e', '#ef4444'];

    const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const handleVolunteerClick = (participant: TopParticipant) => {
        setSelectedVolunteer(participant);
        setIsModalOpen(true);
    };

    return (
        <AppLayout>
            <Head title="Manager Dashboard" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-primary/10 pb-6">
                        <div>
                            <h1 className="text-4xl font-bold flex items-center gap-2">
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Hi, {auth?.user?.name || 'Manager'}!
                                </span>
                                <Hand className="h-10 w-10 text-yellow-500 inline-block animate-pulse" />
                            </h1>
                            <p className="text-muted-foreground mt-2">Here's what's happening with your club today.</p>
                        </div>
                        {/* FIXED: Link redirects to Manage Events page instead of /create */}
                        <Button onClick={() => router.get('/events')} size="lg" className="shadow-md">
                            <CalendarDays className="mr-2 h-5 w-5" /> Manage Events
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <SummaryCard 
                            title="Upcoming Events"
                            value={summary.upcoming_events}
                            icon={CalendarDays}
                            className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 hover:bg-yellow-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                            titleColor="text-yellow-900 dark:text-yellow-100"
                            valueColor="text-yellow-900 dark:text-yellow-100"
                            iconColor="text-yellow-600 dark:text-yellow-400"
                        />
                        <SummaryCard 
                            title="Completed Events"
                            value={summary.completed_events}
                            icon={CheckCircle}
                            className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 hover:bg-green-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                            titleColor="text-green-900 dark:text-green-100"
                            valueColor="text-green-900 dark:text-green-100"
                            iconColor="text-green-600 dark:text-green-400"
                        />
                        <SummaryCard 
                            title="Total Members"
                            value={summary.total_members}
                            icon={Users}
                            className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 hover:bg-blue-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                            titleColor="text-blue-900 dark:text-blue-100"
                            valueColor="text-blue-900 dark:text-blue-100"
                            iconColor="text-blue-600 dark:text-blue-400"
                        />
                        <SummaryCard 
                            title="Total Registrations"
                            value={summary.total_registrations}
                            icon={ClipboardList}
                            className="bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800 hover:bg-pink-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                            titleColor="text-pink-900 dark:text-pink-100"
                            valueColor="text-pink-900 dark:text-pink-100"
                            iconColor="text-pink-600 dark:text-pink-400"
                            subtext={
                                <span className="text-xs text-pink-700 dark:text-pink-300 font-medium">
                                    {summary.pending_registrations} pending approval
                                </span>
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Charts */}
                        <div className="lg:col-span-1 space-y-8">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Building2 className="h-5 w-5 text-gray-500" />
                                        Members by Faculty
                                    </CardTitle>
                                    <CardDescription>Distribution across faculties</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FacultyDonutChart 
                                        data={participants_faculty_distribution} 
                                        total={totalParticipants} 
                                        colors={facultyColorsHex} 
                                    />
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <TrendingUp className="h-5 w-5 text-gray-500" />
                                        Top Events
                                    </CardTitle>
                                    <CardDescription>Highest member participation</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FacultyDonutChart 
                                        data={member_engagement} 
                                        total={Object.values(member_engagement).reduce((a, b) => a + b, 0)} 
                                        colors={engagementColorsHex} 
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            {/* Upcoming Events */}
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl">Upcoming Events</CardTitle>
                                        <CardDescription>{upcoming_events.length} events scheduled</CardDescription>
                                    </div>
                                    <Button variant="ghost" onClick={() => router.get('/events')} className="text-primary hover:text-primary/80">
                                        View All <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                        {upcoming_events.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-8">No upcoming events.</p>
                                        ) : (
                                            upcoming_events.slice(0, 5).map((event) => (
                                                <div 
                                                    key={event.id} 
                                                    className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors cursor-pointer"
                                                    onClick={() => router.get(`/events/${event.id}/participants`)}
                                                >
                                                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-primary/10 rounded-lg text-primary border border-primary/10">
                                                        <span className="text-[10px] font-bold uppercase tracking-wide">
                                                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                                                        </span>
                                                        <span className="text-xl font-bold leading-none">
                                                            {new Date(event.date).getDate()}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-base text-foreground truncate">{event.name}</h4>
                                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3.5 w-3.5" /> {event.location}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Users className="h-3.5 w-3.5" /> {event.participants_count} joined
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Top Volunteers */}
                                <Card className="shadow-sm h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Award className="h-5 w-5 text-yellow-500" />
                                            Top Volunteers
                                        </CardTitle>
                                        <CardDescription>Most active participants</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {top_participants?.length === 0 ? (
                                                <p className="text-center text-muted-foreground py-4">No volunteer data yet.</p>
                                            ) : (
                                                top_participants?.slice(0, 5).map((participant, index) => (
                                                    <div 
                                                        key={participant.id} 
                                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-muted"
                                                        onClick={() => handleVolunteerClick(participant)}
                                                    >
                                                        <div className={`
                                                            w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold text-white shadow-sm
                                                            ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'}
                                                        `}>
                                                            {index + 1}
                                                        </div>
                                                        <Avatar className="h-10 w-10 border border-gray-200">
                                                            {participant.profile_picture && <AvatarImage src={`/storage/${participant.profile_picture}`} />}
                                                            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                                                {getInitials(participant.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold truncate">{participant.name}</p>
                                                            <p className="text-xs text-muted-foreground break-words line-clamp-1">{participant.faculty}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge variant="secondary" className="font-mono">
                                                                {participant.total_hours}h
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Recent Notifications */}
                                <Card className="shadow-sm h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Mail className="h-5 w-5 text-gray-500" />
                                            Recent Activity
                                        </CardTitle>
                                        <CardDescription>System updates</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-0 relative">
                                            <div className="absolute left-5 top-2 bottom-2 w-px bg-gray-200" />
                                            {recent_notifications.length === 0 ? (
                                                <p className="text-center text-muted-foreground py-4">No recent notifications.</p>
                                            ) : (
                                                recent_notifications.slice(0, 5).map((notification, index) => (
                                                    <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                                                        <div className="relative z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200 shadow-sm">
                                                            {notification.type === 'membership_request' ? <UserPlus className="h-4 w-4 text-blue-500" /> :
                                                             notification.type === 'event_happening' ? <Calendar className="h-4 w-4 text-orange-500" /> :
                                                             <UserCheck className="h-4 w-4 text-green-500" />}
                                                        </div>
                                                        <div className="flex-1 pt-1">
                                                            <p className="text-sm text-foreground line-clamp-2 leading-snug">{notification.message}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {new Date(notification.timestamp).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Volunteer Details Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-500" />
                            Volunteer Profile
                        </DialogTitle>
                        <DialogDescription>Detailed information about the participant.</DialogDescription>
                    </DialogHeader>
                    {selectedVolunteer && (
                        <div className="flex flex-col items-center space-y-6 py-4">
                            <div className="text-center space-y-2">
                                <Avatar className="h-24 w-24 border-4 border-white shadow-lg mx-auto">
                                    {selectedVolunteer.profile_picture && (
                                        <AvatarImage src={`/storage/${selectedVolunteer.profile_picture}`} />
                                    )}
                                    <AvatarFallback className="text-3xl font-bold bg-blue-100 text-blue-600">
                                        {getInitials(selectedVolunteer.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedVolunteer.name}</h3>
                                    <p className="text-muted-foreground font-medium">{selectedVolunteer.faculty}</p>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/30 py-1 px-3 rounded-full">
                                    <Mail className="h-3 w-3" /> {selectedVolunteer.email}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                                    <p className="text-3xl font-bold text-blue-600">{selectedVolunteer.total_hours}</p>
                                    <p className="text-xs text-blue-700 font-bold uppercase tracking-wider mt-1">Total Hours</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                                    <p className="text-3xl font-bold text-green-600">{selectedVolunteer.events_participated}</p>
                                    <p className="text-xs text-green-700 font-bold uppercase tracking-wider mt-1">Events Joined</p>
                                </div>
                            </div>

                            {/* Event Participation History List */}
                            <div className="w-full">
                                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                    <History className="h-4 w-4 text-muted-foreground" />
                                    Participation History
                                </h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 border rounded-lg p-2 bg-muted/10">
                                    {selectedVolunteer.participated_events && selectedVolunteer.participated_events.length > 0 ? (
                                        selectedVolunteer.participated_events.map((event) => (
                                            <div key={event.id} className="flex justify-between items-center text-sm p-2 hover:bg-white rounded-md transition-colors">
                                                <div className="flex-1 min-w-0 mr-2">
                                                    <p className="font-medium truncate" title={event.name}>{event.name}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                                                </div>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap flex-shrink-0">
                                                    {event.hours} hrs
                                                </Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                            No detailed event history available.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 w-full">
                                <Button className="flex-1" onClick={() => window.location.href = `mailto:${selectedVolunteer.email}`}>
                                    <Mail className="mr-2 h-4 w-4" /> Send Email
                                </Button>
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}