import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { edit as profileEdit } from '@/routes/profile';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CalendarDays, Bell, BarChart3, MapPin, Award, Clock, User, Hand, CheckCircle, ArrowRight, Calendar, ClipboardList, Mail, History, AlertCircle, Star, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'My Dashboard',
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
  has_feedback?: boolean;
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
    borderColor,
    iconColor,
    onClick,
}: {
    title: string;
    value: number | string;
    icon: any;
    subtext?: React.ReactNode;
    borderColor: string;
    iconColor: string;
    onClick?: () => void;
}) => (
    <Card
        className={`border-l-4 ${borderColor} hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
        onClick={onClick}
    >
        <CardContent className="pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    {subtext && <div className="mt-1">{subtext}</div>}
                </div>
                <Icon className={`h-8 w-8 ${iconColor}`} />
            </div>
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

  // Profile completion tracking
  const profileFields = [
    { key: 'profile_picture', label: 'Profile Picture', completed: !!user.profile_picture },
    { key: 'secondary_email', label: 'Secondary Email', completed: !!user.secondary_email },
    { key: 'phone_number', label: 'Phone Number', completed: !!user.phone_number },
    { key: 'faculty', label: 'Faculty', completed: !!user.faculty },
  ];
  const completedFieldsCount = profileFields.filter(f => f.completed).length;
  const totalFieldsCount = profileFields.length;
  const profileCompletionPercent = Math.round((completedFieldsCount / totalFieldsCount) * 100);
  const isProfileComplete = completedFieldsCount === totalFieldsCount;
  const getMissingFields = () => profileFields.filter(f => !f.completed).map(f => f.label.toLowerCase());

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
          case 0: return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800/30'; // Gold
          case 1: return 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/30'; // Silver
          case 2: return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/30'; // Bronze
          default: return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/30';
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

  // Event availability status (Open/Full)
  const getEventAvailability = (event: Event, userStatus: string | null) => {
    const totalParticipants = event.participants?.filter(
      p => p.status.toLowerCase() === 'approved' || p.status.toLowerCase() === 'pending_approval'
    ).length || 0;
    const isFull = event.capacity ? totalParticipants >= event.capacity : false;

    // If user is already registered, don't show availability
    if (userStatus === 'approved' || userStatus === 'pending_approval') {
      return null;
    }

    if (isFull) {
      return { text: 'Full', color: 'text-red-600 bg-red-50 border-red-100' };
    }

    return { text: 'Open', color: 'text-green-600 bg-green-50 border-green-100' };
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

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">

            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-primary/10 pb-6">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-2">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Hi, {user.name.split(' ')[0]}!
                        </span>
                        <Hand className="h-10 w-10 text-yellow-500 inline-block" />
                    </h1>
                    <p className="text-muted-foreground mt-2">Here's an overview of your volunteer activities.</p>
                </div>
                <Button onClick={() => router.get('/join-events')} size="lg" className="shadow-md">
                    <CalendarDays className="mr-2 h-5 w-5" /> Browse Events
                </Button>
            </div>

            {/* Profile Completion Card */}
            {!isProfileComplete && (
                <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            {/* Progress Circle & Info */}
                            <div className="flex items-center gap-4 flex-1">
                                {/* Circular Progress Indicator */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center border-4 border-amber-300 dark:border-amber-700/50">
                                        <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
                                            {completedFieldsCount}/{totalFieldsCount}
                                        </span>
                                    </div>
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                                        <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                                            Complete Your Profile
                                        </h3>
                                        <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/50 text-xs">
                                            {profileCompletionPercent}%
                                        </Badge>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-2">
                                        <Progress
                                            value={profileCompletionPercent}
                                            className="h-2 bg-amber-200 dark:bg-amber-900/30"
                                        />
                                    </div>

                                    {/* Field Status */}
                                    <div className="flex flex-wrap gap-2">
                                        {profileFields.map((field) => (
                                            <span
                                                key={field.key}
                                                className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                                    field.completed
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                        : 'bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                }`}
                                            >
                                                {field.completed ? (
                                                    <CheckCircle className="h-3 w-3" />
                                                ) : (
                                                    <AlertCircle className="h-3 w-3" />
                                                )}
                                                {field.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <Button
                                onClick={() => router.visit(profileEdit().url)}
                                className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white shadow-sm whitespace-nowrap"
                            >
                                <User className="h-4 w-4 mr-2" />
                                Update Profile
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 2. Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard
                    title="My Registered Events"
                    value={registeredEvents.length}
                    icon={ClipboardList}
                    borderColor="border-l-blue-500"
                    iconColor="text-blue-500"
                    subtext={<p className="text-xs text-muted-foreground">Your event registrations</p>}
                    onClick={() => {
                        // Scroll to My Events section
                        document.getElementById('my-events-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                />
                <SummaryCard
                    title="Upcoming Events"
                    value={stats.upcomingEventsCount}
                    icon={CalendarDays}
                    borderColor="border-l-yellow-500"
                    iconColor="text-yellow-500"
                    subtext={<p className="text-xs text-muted-foreground">Events happening soon</p>}
                    onClick={() => router.get('/join-events')}
                />
                <SummaryCard
                    title="Pending Approvals"
                    value={registeredEvents.filter(e => e.status.toLowerCase() === 'pending' || e.status.toLowerCase() === 'pending_approval').length}
                    icon={Clock}
                    borderColor="border-l-orange-500"
                    iconColor="text-orange-500"
                    subtext={<p className="text-xs text-muted-foreground">Awaiting confirmation</p>}
                    onClick={() => {
                        // Scroll to My Events section
                        document.getElementById('my-events-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                />
            </div>

            {/* 3. Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Upcoming Opportunities */}
                    <Card className="shadow-sm">
                         <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-3">
                            <div className="space-y-1">
                                <CardTitle className="text-base sm:text-lg">Upcoming Opportunities</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Events open for registration</CardDescription>
                            </div>
                            <Button variant="ghost" onClick={() => router.get('/join-events')} className="text-primary hover:text-primary/80 text-xs sm:text-sm">
                                View All <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
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
                                        const isFull = event.capacity ? totalParticipants >= event.capacity : false;
                                        const isPaid = event.fee && event.fee > 0;

                                        // Consolidated availability text
                                        const getAvailabilityInfo = () => {
                                            if (status) return null; // User already registered
                                            if (isFull) return { text: 'Full', color: 'text-red-600 bg-red-50 border-red-100' };
                                            if (slotsLeft !== null && slotsLeft <= 5) {
                                                return { text: `${slotsLeft} left`, color: 'text-orange-600 bg-orange-50 border-orange-100' };
                                            }
                                            return { text: 'Open', color: 'text-green-600 bg-green-50 border-green-100' };
                                        };
                                        const availabilityInfo = getAvailabilityInfo();

                                        return (
                                            <div
                                                key={event.id}
                                                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/40 transition-colors cursor-pointer group"
                                                onClick={() => router.get(`/join-events?event_id=${event.id}`)}
                                            >
                                                {/* Event thumbnail with date fallback */}
                                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden flex-shrink-0 border bg-muted relative">
                                                    {event.image_path ? (
                                                        <img src={`/storage/${event.image_path}`} alt={event.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
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

                                                {/* Event details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                                                            {event.name}
                                                        </h4>
                                                        {isPaid && (
                                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-blue-50 text-blue-600 border-blue-200 flex-shrink-0">
                                                                RM{event.fee}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1 flex-wrap">
                                                        <span className="flex items-center gap-1 flex-shrink-0">
                                                            <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                            {new Date(event.start_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                        <span className="flex items-center gap-1 truncate">
                                                            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                            <span className="truncate">{event.location}</span>
                                                        </span>
                                                    </div>
                                                    {/* Consolidated badges row */}
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${countdown.color}`}>
                                                            {countdown.text}
                                                        </span>
                                                        {availabilityInfo && (
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${availabilityInfo.color}`}>
                                                                {availabilityInfo.text}
                                                            </span>
                                                        )}
                                                        {status && (
                                                            <>
                                                                {status === 'approved' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none text-[10px] h-5">Registered</Badge>}
                                                                {status === 'pending_approval' && <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 shadow-none text-[10px] h-5">Pending</Badge>}
                                                                {status === 'rejected' && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 shadow-none text-[10px] h-5">Rejected</Badge>}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Quick register or arrow */}
                                                {!status && !isFull ? (
                                                    <Button
                                                        size="sm"
                                                        className="opacity-0 sm:group-hover:opacity-100 transition-opacity text-xs h-7 sm:h-8 px-2 sm:px-3 flex-shrink-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRegisterClick(event);
                                                        }}
                                                    >
                                                        <span className="hidden sm:inline">{isPaid ? 'Register' : 'Join'}</span>
                                                        <span className="sm:hidden">+</span>
                                                    </Button>
                                                ) : (
                                                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* My Registered Events - with Tabs */}
                    <Card id="my-events-section" className="shadow-sm">
                        <CardHeader className="border-b pb-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <CardTitle className="text-base sm:text-xl flex items-center gap-2">
                                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                        My Events
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Track your event registrations</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => router.get('/join-events')} className="text-xs w-full sm:w-auto">
                                    Browse More
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {registeredEvents.length > 0 ? (
                                <Tabs defaultValue="upcoming" className="w-full">
                                    <div className="px-4 pt-4">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="upcoming" className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                Upcoming
                                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                                    {registeredEvents.filter(e => new Date(e.end_date) >= new Date()).length}
                                                </Badge>
                                            </TabsTrigger>
                                            <TabsTrigger value="past" className="flex items-center gap-1.5">
                                                <History className="h-3.5 w-3.5" />
                                                Past
                                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                                    {registeredEvents.filter(e => new Date(e.end_date) < new Date()).length}
                                                </Badge>
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    {/* Upcoming Events Tab */}
                                    <TabsContent value="upcoming" className="mt-0">
                                        {(() => {
                                            const upcomingRegistered = registeredEvents.filter(e => new Date(e.end_date) >= new Date());
                                            if (upcomingRegistered.length === 0) {
                                                return (
                                                    <div className="py-8 text-center text-muted-foreground">
                                                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                        <p className="text-sm">No upcoming events</p>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="divide-y">
                                                    {upcomingRegistered.map((event) => {
                                                        const daysUntil = Math.ceil((new Date(event.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                        const timeLabel = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`;
                                                        const timeColor = daysUntil <= 1 ? 'text-red-600 bg-red-50' : daysUntil <= 3 ? 'text-orange-600 bg-orange-50' : 'text-blue-600 bg-blue-50';

                                                        return (
                                                            <div
                                                                key={event.id}
                                                                className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group cursor-pointer"
                                                                onClick={() => router.get(`/join-events?event_id=${event.id}`)}
                                                            >
                                                                <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border bg-muted">
                                                                    {event.image_path ? (
                                                                        <img src={`/storage/${event.image_path}`} alt={event.name} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary">
                                                                            <Calendar className="h-5 w-5 opacity-50" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                                        {event.name}
                                                                    </h4>
                                                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                                                                        <MapPin className="h-3 w-3" />
                                                                        {event.location}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${timeColor}`}>
                                                                            {timeLabel}
                                                                        </span>
                                                                        {event.status === 'approved' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none text-[10px] h-5">Approved</Badge>}
                                                                        {event.status === 'pending_approval' && <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 shadow-none text-[10px] h-5">Pending</Badge>}
                                                                        {event.status === 'rejected' && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 shadow-none text-[10px] h-5">Rejected</Badge>}
                                                                    </div>
                                                                </div>
                                                                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </TabsContent>

                                    {/* Past Events Tab */}
                                    <TabsContent value="past" className="mt-0">
                                        {(() => {
                                            const pastRegistered = registeredEvents.filter(e => new Date(e.end_date) < new Date());
                                            if (pastRegistered.length === 0) {
                                                return (
                                                    <div className="py-8 text-center text-muted-foreground">
                                                        <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                        <p className="text-sm">No past events yet</p>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="divide-y">
                                                    {pastRegistered.map((event) => {
                                                        const daysSince = Math.ceil((new Date().getTime() - new Date(event.end_date).getTime()) / (1000 * 60 * 60 * 24));
                                                        const timeLabel = daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`;

                                                        return (
                                                            <div
                                                                key={event.id}
                                                                className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group"
                                                            >
                                                                <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border bg-muted grayscale opacity-70">
                                                                    {event.image_path ? (
                                                                        <img src={`/storage/${event.image_path}`} alt={event.name} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                                                                            <Calendar className="h-5 w-5 opacity-50" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-medium text-sm text-foreground truncate">
                                                                        {event.name}
                                                                    </h4>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-gray-500 bg-gray-100">
                                                                            {timeLabel}
                                                                        </span>
                                                                        {event.status === 'approved' && (
                                                                            <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200 shadow-none text-[10px] h-5">Completed</Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {/* Feedback button for past approved events */}
                                                                {event.status === 'approved' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant={event.has_feedback ? "outline" : "default"}
                                                                        className={`text-xs h-7 ${event.has_feedback ? 'text-green-600 border-green-200' : ''}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            router.get(`/events-gallery?event_id=${event.id}&tab=feedback`);
                                                                        }}
                                                                    >
                                                                        {event.has_feedback ? (
                                                                            <><CheckCircle className="h-3 w-3 mr-1" /> Feedback Sent</>
                                                                        ) : (
                                                                            <><Star className="h-3 w-3 mr-1" /> Give Feedback</>
                                                                        )}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </TabsContent>
                                </Tabs>
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
                        <CardContent className="pt-4">
                            <div className="w-full h-[250px] sm:h-[300px]">
                                {loadingChartData ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={activityChartData}
                                            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                                dy={8}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                                allowDecimals={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f3f4f6' }}
                                                contentStyle={{
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                    fontSize: '12px'
                                                }}
                                            />
                                            <Bar
                                                dataKey="events"
                                                fill="#3b82f6"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={40}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (1/3 width) */}
                <div className="space-y-8">
                    
                    {/* Notifications */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-2">
                            <div>
                                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                    Notifications
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Recent updates and alerts</CardDescription>
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
                                                    notification.read_at ? 'bg-card' : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
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
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                                Top Volunteers
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Community leaderboard</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* User's rank indicator */}
                            {topVolunteers.length > 0 && (() => {
                                const userRankIndex = topVolunteers.findIndex(v => v.id === user.id);
                                const userRank = userRankIndex !== -1 ? userRankIndex + 1 : null;
                                const userInTop5 = userRank !== null && userRank <= 5;

                                if (userRank && !userInTop5) {
                                    return (
                                        <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-primary">#{userRank}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Your Ranking</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {userRank <= 10 ? 'Almost there! Keep volunteering!' : 'Keep participating to climb up!'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                {topVolunteers[userRankIndex]?.total_hours || 0}h
                                            </Badge>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            <div className="space-y-3">
                                {topVolunteers.length === 0 ? (
                                    <EmptyState icon={Award} message="No data available." />
                                ) : (
                                    topVolunteers.slice(0, 5).map((volunteer, index) => {
                                        const isCurrentUser = volunteer.id === user.id;
                                        return (
                                        <div
                                            key={volunteer.id}
                                            className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${getMedalBgColor(index)} bg-opacity-40 ${isCurrentUser ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                            onClick={() => handleVolunteerClick(volunteer)}
                                        >
                                            <div className={`
                                                w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-xs font-bold text-white shadow-sm flex-shrink-0
                                                ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'}
                                            `}>
                                                {index + 1}
                                            </div>

                                            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                                                {volunteer.profile_picture && <AvatarImage src={`/storage/${volunteer.profile_picture}`} />}
                                                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                                    {getInitials(volunteer.name)}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm font-semibold truncate" title={volunteer.name}>{volunteer.name}</p>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground truncate" title={volunteer.faculty || 'Faculty N/A'}>
                                                    {volunteer.faculty || 'Faculty N/A'}
                                                </p>
                                            </div>

                                            <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0">
                                                {volunteer.total_hours}h
                                            </Badge>
                                        </div>
                                    );
                                })
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