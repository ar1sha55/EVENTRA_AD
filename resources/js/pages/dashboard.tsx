import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { edit as profileEdit } from '@/routes/profile';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CalendarDays, Bell, BarChart3, MapPin, Award, Clock, User, Hand, CheckCircle, ArrowRight, Calendar, ClipboardList, Mail, History, AlertCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
];

// --- Types ---
type Participant = {
  id: number;
  user_id: number;
  event_id: number;
  status: string;
  payment_proof_path?: string;
  registration_date: string;
  last_updated: string;
};

interface Event {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string;
  capacity?: number;
  fee?: number;
  status?: 'draft' | 'published' | 'archived';
  image_path?: string;
  qr_code_path?: string;
  participants?: Participant[];
  participants_count?: number;
}

interface Stats {
  totalEvents: number;
  upcomingEventsCount: number;
}

type User = {
  id: number;
  name: string;
  email: string;
  secondary_email?: string;
  phone_number?: string;
  faculty?: string;
  profile_picture?: string;
};

interface TopVolunteer {
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

interface RegisteredEvent {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  image_path?: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  registration_date: string;
}

interface DashboardNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: {
    event_id?: number;
    event_name?: string;
    start_date?: string;
  };
  read_at: string | null;
  created_at: string;
}

interface DashboardProps {
  upcomingEvents?: Event[];
  stats?: Stats;
  topVolunteers?: TopVolunteer[];
  registeredEvents?: RegisteredEvent[];
  recentNotifications?: DashboardNotification[];
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
    <Card className={`${className} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-default`}>
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

// Empty State Helper
const EmptyState = ({ icon: Icon, message, action }: { icon: any; message: string; action?: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/5 rounded-lg border border-dashed">
        <Icon className="h-10 w-10 mb-3 opacity-20" />
        <p className="text-sm mb-3">{message}</p>
        {action}
    </div>
);

export default function Dashboard({ upcomingEvents = [], stats = { totalEvents: 0, upcomingEventsCount: 0 }, topVolunteers = [], registeredEvents = [], recentNotifications = [] }: DashboardProps) {
  const page = usePage();
  const auth = page.props.auth as { user: User };
  const { user } = auth;

  // Helper functions
  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Check if profile is complete
  const isProfileComplete = user.profile_picture && user.secondary_email && user.phone_number && user.faculty;
  const getMissingFields = () => {
    const missing = [];
    if (!user.profile_picture) missing.push('profile picture');
    if (!user.secondary_email) missing.push('secondary email');
    if (!user.phone_number) missing.push('phone number');
    if (!user.faculty) missing.push('faculty');
    return missing;
  };

  // Colors for leaderboards
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

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [paymentProofEvent, setPaymentProofEvent] = useState<Event | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for volunteer modal
  const [selectedVolunteer, setSelectedVolunteer] = useState<TopVolunteer | null>(null);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);

  // Countdown Logic
  const getCountdown = (startDate: string) => {
    const now = new Date();
    const eventDate = new Date(startDate);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Today!', color: 'text-red-600 bg-red-50' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-orange-600 bg-orange-50' };
    if (diffDays <= 7) return { text: `in ${diffDays} days`, color: 'text-yellow-600 bg-yellow-50' };
    return { text: `in ${diffDays} days`, color: 'text-blue-600 bg-blue-50' };
  };

  // Handlers
  const handleRegisterClick = (event: Event) => {
    if (event.fee && event.fee > 0) {
      setPaymentProofEvent(event);
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
    } else {
      handleRegister(event.id);
    }
  };

  const handleRegister = (eventId: number, paymentProof?: File) => {
    setProcessing(true);
    const handleSuccess = () => {
      setPaymentProofEvent(null);
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
      setProcessing(false);
    };

    if (paymentProof) {
      const formData = new FormData();
      formData.append('payment_proof', paymentProof);
      router.post(`/events/${eventId}/register`, formData, {
        forceFormData: true, onSuccess: handleSuccess, onError: () => setProcessing(false),
      });
    } else {
      router.post(`/events/${eventId}/register`, {}, {
        onSuccess: handleSuccess, onError: () => setProcessing(false),
      });
    }
  };

  const handleUnregister = (participantId: number) => {
    router.delete(`/participants/${participantId}`, {
      onSuccess: () => {
        if (selectedEvent) {
          setSelectedEvent({
            ...selectedEvent,
            participants: selectedEvent.participants?.filter(p => p.id !== participantId) || []
          });
        }
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPaymentProofFile(file);
    if (file) {
      setPaymentProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitPaymentProof = () => {
    if (paymentProofEvent && paymentProofFile) {
      handleRegister(paymentProofEvent.id, paymentProofFile);
    }
  };

  const getParticipantStatus = (event: Event): { status: string | null; participantId: number | null } => {
    if (!user || !event.participants || event.participants.length === 0) {
      return { status: null, participantId: null };
    }
    const participant = event.participants.find((p: Participant) => p.user_id === user.id);
    return {
      status: participant ? participant.status.toLowerCase() : null,
      participantId: participant ? participant.id : null,
    };
  };

  // Handle volunteer click
  const handleVolunteerClick = (volunteer: TopVolunteer) => {
    setSelectedVolunteer(volunteer);
    setIsVolunteerModalOpen(true);
  };

  // Chart Data (Dynamic)
  const [activityChartData, setActivityChartData] = useState<Array<{ name: string; events: number }>>([]);
  const [loadingChartData, setLoadingChartData] = useState(true);

  // Fetch activity chart data on component mount
  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoadingChartData(true);
        const response = await axios.get('/api/dashboard/activity-chart');
        if (response.data.success) {
          setActivityChartData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching activity chart data:', error);
        // Fallback to empty data if fetch fails
        setActivityChartData([
          { name: "Jan", events: 0 }, { name: "Feb", events: 0 },
          { name: "Mar", events: 0 }, { name: "Apr", events: 0 },
          { name: "May", events: 0 }, { name: "Jun", events: 0 },
        ]);
      } finally {
        setLoadingChartData(false);
      }
    };

    fetchActivityData();
  }, []);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto space-y-8">

            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-primary/10 pb-6">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-2">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Hi, {user.name.split(' ')[0]}!
                        </span>
                        <Hand className="h-10 w-10 text-yellow-500 inline-block animate-pulse" />
                    </h1>
                    <p className="text-muted-foreground mt-2">Here's an overview of your volunteer activities.</p>
                </div>
                <Button onClick={() => router.get('/join-events')} size="lg" className="shadow-md">
                    <CalendarDays className="mr-2 h-5 w-5" /> Browse Events
                </Button>
            </div>

            {/* Profile Completion Alert */}
            {!isProfileComplete && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold">
                        Complete Your Profile
                    </AlertTitle>
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
                            <p>
                                Please complete your profile by adding your{' '}
                                {getMissingFields().map((field, index) => (
                                    <span key={field}>
                                        <strong>{field}</strong>
                                        {index < getMissingFields().length - 1 && ' and '}
                                    </span>
                                ))}.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.visit(profileEdit().url)}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 whitespace-nowrap"
                            >
                                Update Profile
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* 2. Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard 
                    title="Total Registered"
                    value={stats.totalEvents}
                    icon={ClipboardList}
                    className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                    titleColor="text-blue-900 dark:text-blue-100"
                    valueColor="text-blue-900 dark:text-blue-100"
                    iconColor="text-blue-600 dark:text-blue-400"
                    subtext={<span className="text-xs text-blue-700">All time registrations</span>}
                />
                <SummaryCard 
                    title="Upcoming Events"
                    value={stats.upcomingEventsCount}
                    icon={CalendarDays}
                    className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
                    titleColor="text-yellow-900 dark:text-yellow-100"
                    valueColor="text-yellow-900 dark:text-yellow-100"
                    iconColor="text-yellow-600 dark:text-yellow-400"
                    subtext={<span className="text-xs text-yellow-700">Events happening soon</span>}
                />
                <SummaryCard 
                    title="Pending Approvals"
                    value={registeredEvents.filter(e => e.status === 'pending_approval').length}
                    icon={Clock}
                    className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"
                    titleColor="text-orange-900 dark:text-orange-100"
                    valueColor="text-orange-900 dark:text-orange-100"
                    iconColor="text-orange-600 dark:text-orange-400"
                    subtext={<span className="text-xs text-orange-700">Awaiting confirmation</span>}
                />
            </div>

            {/* 3. Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Upcoming Opportunities */}
                    <Card className="shadow-sm">
                         <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                            <div className="space-y-1">
                                <CardTitle className="text-lg">Upcoming Opportunities</CardTitle>
                                <CardDescription>Events open for registration</CardDescription>
                            </div>
                            <Button variant="ghost" onClick={() => router.get('/join-events')} className="text-primary hover:text-primary/80">
                                View All <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {upcomingEvents.length === 0 ? (
                                    <EmptyState icon={Calendar} message="No upcoming events available." />
                                ) : (
                                    upcomingEvents.slice(0, 3).map((event) => {
                                        const countdown = getCountdown(event.start_date);
                                        const { status } = getParticipantStatus(event);
                                        const totalParticipants = event.participants?.filter(p => p.status.toLowerCase() === 'approved' || p.status.toLowerCase() === 'pending_approval').length || 0;
                                        const slotsLeft = event.capacity ? event.capacity - totalParticipants : null;

                                        return (
                                            <div
                                                key={event.id}
                                                className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors cursor-pointer group"
                                                onClick={() => router.get(`/join-events?event_id=${event.id}`)}
                                            >
                                                <div className="h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 border bg-muted">
                                                    {event.image_path ? (
                                                        <img src={`/storage/${event.image_path}`} alt={event.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-green-50 text-green-700 border border-green-100 group-hover:bg-green-100 transition-colors">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <span className="text-[10px] font-bold uppercase tracking-wide">
                                                                    {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short' })}
                                                                </span>
                                                                <span className="text-xl font-bold leading-none">
                                                                    {new Date(event.start_date).getDate()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                                                        {event.name}
                                                    </h4>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays className="h-3.5 w-3.5" />
                                                            {new Date(event.start_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                        <span className="flex items-center gap-1 truncate">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {event.location}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${countdown.color}`}>
                                                            {countdown.text}
                                                        </span>
                                                        {event.fee && event.fee > 0 && (
                                                            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                                RM {event.fee}
                                                            </span>
                                                        )}
                                                        {slotsLeft !== null && (
                                                            <span className="text-[10px] font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                                {slotsLeft} {slotsLeft === 1 ? 'slot' : 'slots'} left
                                                            </span>
                                                        )}
                                                    </div>
                                                    {status && (
                                                        <div className="mt-2">
                                                            {status === 'approved' && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 shadow-none text-xs">Registered</Badge>}
                                                            {status === 'pending_approval' && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 shadow-none text-xs">Pending Approval</Badge>}
                                                            {status === 'rejected' && <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 shadow-none text-xs">Rejected</Badge>}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* My Registered Events */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                            <div className="space-y-1">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Award className="h-5 w-5 text-purple-600" />
                                    My Registered Events
                                </CardTitle>
                                <CardDescription>Events you are actively participating in</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {registeredEvents.length > 0 ? (
                                <div className="divide-y">
                                    {registeredEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group cursor-pointer"
                                            onClick={() => router.get(`/join-events?event_id=${event.id}`)}
                                        >
                                            <div className="h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 border bg-muted">
                                                {event.image_path ? (
                                                    <img src={`/storage/${event.image_path}`} alt={event.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary">
                                                        <Calendar className="h-6 w-6 opacity-50" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h4 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                                                        {event.name}
                                                    </h4>
                                                    <div className="flex-shrink-0">
                                                        {event.status === 'approved' && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 shadow-none">Approved</Badge>}
                                                        {event.status === 'pending_approval' && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 shadow-none">Pending</Badge>}
                                                        {event.status === 'rejected' && <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 shadow-none">Rejected</Badge>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDays className="h-3.5 w-3.5" />
                                                        {new Date(event.start_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <span className="flex items-center gap-1 truncate">
                                                        <MapPin className="h-3.5 w-3.5" /> {event.location}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Calendar}
                                    message="You haven't registered for any events yet."
                                    action={<Button variant="link" onClick={() => router.get('/join-events')}>Browse events now</Button>}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Activity Overview Chart */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="h-5 w-5 text-gray-500" />
                                Activity Overview
                            </CardTitle>
                            <CardDescription>Events participated over the last 6 months</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] pt-4">
                            {loadingChartData ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={activityChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                        <Tooltip
                                            cursor={{ fill: '#f3f4f6' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="events" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (1/3 width) */}
                <div className="space-y-8">
                    
                    {/* Notifications */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-purple-600" />
                                    Notifications
                                </CardTitle>
                                <CardDescription>Recent updates and alerts</CardDescription>
                            </div>
                            {recentNotifications.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.visit('/notifications')}
                                    className="text-xs"
                                >
                                    View All
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {recentNotifications.length === 0 ? (
                                <EmptyState icon={Bell} message="No notifications yet" />
                            ) : (
                                <div className="space-y-3">
                                    {recentNotifications.map((notification) => {
                                        const getNotificationIcon = () => {
                                            switch (notification.type) {
                                                case 'event_upcoming': return { icon: Calendar, color: 'text-yellow-600 bg-yellow-50' };
                                                case 'event_new': return { icon: CalendarDays, color: 'text-blue-600 bg-blue-50' };
                                                case 'registration_approved': return { icon: CheckCircle, color: 'text-green-600 bg-green-50' };
                                                case 'registration_rejected': return { icon: Bell, color: 'text-red-600 bg-red-50' };
                                                case 'ranking_update': return { icon: Award, color: 'text-purple-600 bg-purple-50' };
                                                case 'registration_pending': return { icon: Clock, color: 'text-orange-600 bg-orange-50' };
                                                case 'new_registration': return { icon: User, color: 'text-indigo-600 bg-indigo-50' };
                                                case 'profile_incomplete': return { icon: AlertCircle, color: 'text-amber-600 bg-amber-50' };
                                                default: return { icon: Bell, color: 'text-gray-600 bg-gray-50' };
                                            }
                                        };

                                        const formatTime = (dateString: string) => {
                                            const date = new Date(dateString);
                                            const now = new Date();
                                            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
                                            if (diffInSeconds < 60) return 'Just now';
                                            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
                                            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
                                            if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
                                            return date.toLocaleDateString();
                                        };

                                        const { icon: NotifIcon, color } = getNotificationIcon();

                                        return (
                                            <div
                                                key={notification.id}
                                                className={`flex gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                                                    notification.read_at ? 'bg-white' : 'bg-blue-50/50 border-blue-200'
                                                }`}
                                                onClick={() => {
                                                    if (notification.type === 'profile_incomplete') {
                                                        // Redirect to profile page
                                                        router.visit(profileEdit().url);
                                                    } else if (notification.data.event_id) {
                                                        // For manager notifications, redirect to participant page
                                                        if (notification.type === 'registration_pending' || notification.type === 'new_registration') {
                                                            router.visit(`/events/${notification.data.event_id}/participants`);
                                                        } else {
                                                            // For member notifications, go to join-events
                                                            router.visit('/join-events');
                                                        }
                                                    }
                                                }}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                                                    <NotifIcon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatTime(notification.created_at)}
                                                    </p>
                                                </div>
                                                {!notification.read_at && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Leaderboard */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Award className="h-5 w-5 text-yellow-500" />
                                Top Volunteers
                            </CardTitle>
                            <CardDescription>Community leaderboard</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topVolunteers.length === 0 ? (
                                    <EmptyState icon={Award} message="No data available." />
                                ) : (
                                    topVolunteers.slice(0, 5).map((volunteer, index) => (
                                        <div 
                                            key={volunteer.id} 
                                            className={`flex items-center gap-3 p-2 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${getMedalBgColor(index)} bg-opacity-40`}
                                            onClick={() => handleVolunteerClick(volunteer)}
                                        >
                                            <div className={`
                                                w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold text-white shadow-sm flex-shrink-0
                                                ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'}
                                            `}>
                                                {index + 1}
                                            </div>
                                            
                                            <Avatar className="h-10 w-10 border border-gray-200 flex-shrink-0">
                                                {volunteer.profile_picture && <AvatarImage src={`/storage/${volunteer.profile_picture}`} />}
                                                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                                    {getInitials(volunteer.name)}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{volunteer.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{volunteer.faculty || 'Faculty N/A'}</p>
                                            </div>
                                            
                                            <Badge variant="secondary" className="font-mono text-xs whitespace-nowrap">
                                                {volunteer.total_hours}h
                                            </Badge>
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

      {/* Volunteer Details Modal (Read-Only - No Email Button) */}
      <Dialog open={isVolunteerModalOpen} onOpenChange={setIsVolunteerModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Volunteer Profile
                </DialogTitle>
                <DialogDescription>Participant achievements and history.</DialogDescription>
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
                            {/* UPDATED: Removed truncate class to show full faculty name */}
                            <p className="text-muted-foreground font-medium">{selectedVolunteer.faculty}</p>
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

                    {/* Event History */}
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

                    <div className="flex justify-end w-full">
                        {/* Changed: Removed Email Button, only Close button spans full width */}
                        <Button variant="outline" onClick={() => setIsVolunteerModalOpen(false)} className="w-full">
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