import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    Clock
} from 'lucide-react';

// Types
interface DashboardSummary {
    upcoming_events: number;
    completed_events: number;
    total_members: number;
    total_registrations: number;
    pending_registrations: number;
}

interface ParticipantStatusBreakdown {
    PENDING?: number;
    APPROVED?: number;
    REJECTED?: number;
}

interface FacultyDistribution {
    [facultyName: string]: number;  
}

interface UpcomingEvent {
    id: number;
    name: string;
    date: string;
    location: string;
    participants_count: number;
    image_path?: string;
}

interface Notification {
    type: string;
    message: string;
    timestamp: string;
    user_name?: string;
    event_name?: string;
}

interface MemberEngagement {
    [eventName: string]: number; 
}

interface TopParticipant {
    id: number;
    name: string;
    email: string;
    faculty: string;
    profile_photo_path?: string;
    total_hours: number;
    events_participated: number;
}

interface DashboardData {
    summary: DashboardSummary;
    participant_status_breakdown: ParticipantStatusBreakdown;
    participants_faculty_distribution: FacultyDistribution;
    upcoming_events: UpcomingEvent[];
    recent_notifications: Notification[];
    member_engagement: MemberEngagement;
    top_participants: TopParticipant[];
}

interface PageProps {
    auth: any;
    dashboardData: DashboardData; // Data comes from Controller now
}

export default function ManagerDashboard({ dashboardData }: { dashboardData: DashboardData }) {
    const { auth } = usePage().props as unknown as PageProps;  

    // Fallback if data isn't passed (e.g., error in controller)
    if (!dashboardData) {
        return (
            <AppLayout>
                <Head title="Manager Dashboard" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="flex items-center justify-center h-64">
                            <p className="text-muted-foreground">No dashboard data available.</p>
                        </div>
                    </div>
                </div>
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

    // Calculate total participants for percentages
    const totalParticipants = Object.values(participants_faculty_distribution).reduce((sum, val) => sum + val, 0);

    // Colors for the pie chart segments
    const facultyColors = [
        'bg-purple-500', 'bg-blue-500', 'bg-red-500', 'bg-yellow-500', 'bg-green-500',
        'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
    ];

    const facultyColorHex = [
        '#a855f7', '#3b82f6', '#ef4444', '#eab308', '#22c55e', '#ec4899', '#6366f1', '#f97316'
    ];

    const engagementColors = [
        'bg-purple-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-red-500'
    ];

    // Medal colors for top participants
    const getMedalColor = (index: number) => {
        switch (index) {
            case 0: return 'from-yellow-400 to-yellow-600'; // Gold
            case 1: return 'from-gray-300 to-gray-500'; // Silver
            case 2: return 'from-orange-400 to-orange-600'; // Bronze
            default: return 'from-blue-500 to-purple-600';
        }
    };

    const getMedalBgColor = (index: number) => {
        switch (index) {
            case 0: return 'bg-yellow-50 border-yellow-200'; // Gold
            case 1: return 'bg-gray-50 border-gray-200'; // Silver
            case 2: return 'bg-orange-50 border-orange-200'; // Bronze
            default: return 'bg-blue-50 border-blue-200';
        }
    };

    // Get initials from name
    const getInitials = (name: string) => {
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <AppLayout>
            <Head title="Manager Dashboard" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div className="pb-4 border-b-2 border-primary/20 w-full">
                            <h1 className="text-4xl font-bold flex items-center gap-2">
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Hi, Manager {auth?.user?.name || 'User'}!
                            </span>
                            <Hand className="h-10 w-10 text-yellow-500 inline-block animate-wave" />
                            </h1>
                            <p className="text-muted-foreground mt-1">Overview of events and member activities</p>
                        </div>
                    </div>

                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Upcoming Events */}
                        <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                    Upcoming Events
                                </CardTitle>
                                <CalendarDays className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-yellow-900 dark:text-yellow-100">
                                    {summary.upcoming_events}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Completed Events */}
                        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
                                    Completed Events
                                </CardTitle>
                                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-green-900 dark:text-green-100">
                                    {summary.completed_events}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Members */}
                        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    Total Members
                                </CardTitle>
                                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                                    {summary.total_members}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Registrations */}
                        <Card className="bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-pink-900 dark:text-pink-100">
                                    Total Registrations
                                </CardTitle>
                                <ClipboardList className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-pink-900 dark:text-pink-100">
                                    {summary.total_registrations}
                                </div>
                                <p className="text-xs text-pink-700 dark:text-pink-300 mt-1">
                                    {summary.pending_registrations} pending
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Middle Section - Charts and Upcoming Events */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Participants by Faculty Pie Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Participants by Faculty
                                </CardTitle>
                                <CardDescription>Distribution across faculties</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {totalParticipants > 0 ? (
                                    <>
                                        <div className="flex items-center justify-center mb-4">
                                            <div className="relative w-48 h-48">
                                                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                                    {(() => {
                                                        let currentAngle = 0;
                                                        const entries = Object.entries(participants_faculty_distribution);
                                                        
                                                        return entries.map(([faculty, count], index) => {
                                                            const percentage = totalParticipants > 0 ? (count / totalParticipants) * 100 : 0;
                                                            const angle = (percentage / 100) * 360;
                                                            const startX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                                                            const startY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                                                            const endAngle = currentAngle + angle;
                                                            const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                                                            const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                                                            const largeArc = angle > 180 ? 1 : 0;
                                                            
                                                            const color = facultyColorHex[index % facultyColorHex.length];
                                                            
                                                            const path = `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`;
                                                            currentAngle = endAngle;
                                                            
                                                            return (
                                                                <path
                                                                    key={faculty}
                                                                    d={path}
                                                                    fill={color}
                                                                    stroke="white"
                                                                    strokeWidth="0.5"
                                                                />
                                                            );
                                                        });
                                                    })()}
                                                    <circle cx="50" cy="50" r="25" fill="white" />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold">{totalParticipants}</p>
                                                        <p className="text-xs text-muted-foreground">Total</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {Object.entries(participants_faculty_distribution).map(([faculty, count], index) => {
                                                const percentage = totalParticipants > 0 ? Math.round((count / totalParticipants) * 100) : 0;
                                                return (
                                                    <div key={faculty} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full ${facultyColors[index % facultyColors.length]}`} />
                                                            <span className="truncate" title={faculty}>{faculty}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-muted-foreground">{count}</span>
                                                            <span className="font-medium min-w-[3rem] text-right">{percentage}%</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No faculty data available
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upcoming Events List */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Upcoming Events</CardTitle>
                                    <CardDescription>{upcoming_events.length} event(s) scheduled</CardDescription>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => router.get('/events')}
                                    className="flex items-center gap-1"
                                >
                                    See All
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {upcoming_events.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No upcoming events scheduled
                                        </p>
                                    ) : (
                                        upcoming_events.slice(0, 5).map((event) => (
                                            <div 
                                                key={event.id} 
                                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                                                onClick={() => router.get(`/events/${event.id}/participants`)}
                                            >
                                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                                    {event.image_path ? (
                                                        <img 
                                                            src={`/storage/${event.image_path}`} 
                                                            alt={event.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <CalendarDays className="h-6 w-6 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{event.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(event.date).toLocaleDateString('en-US', { 
                                                            month: 'short', 
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">
                                                    {event.participants_count} participants
                                                </Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bottom Section - Members Engagement and Top Participants */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Members Engagement Donut Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Members Engagement</CardTitle>
                                <CardDescription>Event participation distribution</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {Object.keys(member_engagement).length > 0 ? (
                                    <>
                                        <div className="flex items-center justify-center mb-4">
                                            <div className="relative w-48 h-48">
                                                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                                    {(() => {
                                                        let currentAngle = 0;
                                                        const entries = Object.entries(member_engagement);
                                                        const totalEngagement = Object.values(member_engagement).reduce((sum, val) => sum + val, 0);
                                                        
                                                        return entries.map(([eventType, count], index) => {
                                                            const percentage = totalEngagement > 0 ? (count / totalEngagement) * 100 : 0;
                                                            const angle = (percentage / 100) * 360;
                                                            const startX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                                                            const startY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                                                            const endAngle = currentAngle + angle;
                                                            const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                                                            const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                                                            const largeArc = angle > 180 ? 1 : 0;
                                                            
                                                            const colors = ['#a855f7', '#3b82f6', '#eab308', '#22c55e', '#ef4444'];
                                                            const color = colors[index % colors.length];
                                                            
                                                            const path = `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`;
                                                            currentAngle = endAngle;
                                                            
                                                            return (
                                                                <path
                                                                    key={eventType}
                                                                    d={path}
                                                                    fill={color}
                                                                    stroke="white"
                                                                    strokeWidth="0.5"
                                                                />
                                                            );
                                                        });
                                                    })()}
                                                    <circle cx="50" cy="50" r="20" fill="white" />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold">
                                                            {Object.values(member_engagement).reduce((sum, val) => sum + val, 0)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">Total</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {Object.entries(member_engagement).map(([eventType, count], index) => (
                                                <div key={eventType} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${engagementColors[index % engagementColors.length]}`} />
                                                        <span className="truncate" title={eventType}>{eventType}</span>
                                                    </div>
                                                    <span className="font-medium">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No engagement data available
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Participants */}
                        <Card>
                            <CardHeader>
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Award className="h-5 w-5 text-yellow-500" />
                                        Top Volunteers
                                    </CardTitle>
                                    <CardDescription>Most hours logged by participants</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {top_participants && top_participants.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No volunteer hours logged yet
                                        </p>
                                    ) : (
                                        top_participants?.map((participant, index) => (
                                            <div 
                                                key={participant.id} 
                                                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${getMedalBgColor(index)} transition-all hover:shadow-md cursor-pointer`}
                                                onClick={() => router.get(`/members/${participant.id}`)}
                                            >
                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMedalColor(index)} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md`}>
                                                    {index + 1}
                                                </div>
                                                
                                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                                    {participant.profile_photo_path ? (
                                                        <AvatarImage 
                                                            src={`/storage/${participant.profile_photo_path}`} 
                                                            alt={participant.name}
                                                        />
                                                    ) : null}
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                                                        {getInitials(participant.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate">{participant.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {participant.faculty || 'No faculty'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {participant.events_participated} {participant.events_participated === 1 ? 'event' : 'events'}
                                                    </p>
                                                </div>
                                                
                                                <div className="flex flex-col items-end">
                                                    <Badge variant="outline" className="bg-white border-2 font-bold whitespace-nowrap">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {participant.total_hours} hrs
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Notifications */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Recent Notifications</CardTitle>
                                <CardDescription>Latest activity updates</CardDescription>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="flex items-center gap-1"
                            >
                                See All
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recent_notifications.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8 col-span-2">
                                        No recent notifications
                                    </p>
                                ) : (
                                    recent_notifications.slice(0, 6).map((notification, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                {notification.type === 'membership_request' && (
                                                    <UserPlus className="h-5 w-5 text-muted-foreground" />
                                                )}
                                                {notification.type === 'event_happening' && (
                                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                                )}
                                                {notification.type === 'event_participation' && (
                                                    <UserCheck className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm">{notification.message}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(notification.timestamp).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
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
        </AppLayout>
    );
}