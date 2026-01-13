import React, { useState, useRef, useEffect, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Eye, ImageIcon, CheckCircle, Users, XCircle, Upload, X, RotateCcw, Clock, CalendarX, RefreshCw, Filter, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EventCardsGridSkeleton } from '@/components/ui/loading-skeletons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Added AlertDialog imports
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/AlertDialog';

type Participant = {
    id: number;
    user_id: number;
    event_id: number;
    status: string;
    payment_proof_path?: string;
    registration_date: string;
    last_updated: string;
};

type Event = {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    capacity?: number;
    fee?: number;
    status: 'draft' | 'published' | 'archived';
    image_path?: string;
    qr_code_path?: string;
    participants?: Participant[];
};

type User = {
    id: number;
    name: string;
    email: string;
};

type JoinEventsPageProps = {
    events: Event[];
    auth: {
        user: User;
    };
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Join Events', href: '/join-events' }];

export default function JoinEvents() {
    const { events, auth } = usePage<JoinEventsPageProps>().props;
    const { user } = auth;

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [confirmRegisterEvent, setConfirmRegisterEvent] = useState<Event | null>(null);
    const [paymentProofEvent, setPaymentProofEvent] = useState<Event | null>(null);
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [posterPreviewOpen, setPosterPreviewOpen] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);

    // State for unregistration confirmation
    const [participantToUnregister, setParticipantToUnregister] = useState<number | null>(null);

    // Filter and sort states
    const [feeFilter, setFeeFilter] = useState<'all' | 'free' | 'paid'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'starting-soon'>('newest');
    const [searchQuery, setSearchQuery] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const publishedEvents = events.filter((event: Event) => event.status === 'published');

    // Filter and sort events
    const filteredAndSortedEvents = useMemo(() => {
        let filtered = [...publishedEvents];

        // Apply fee filter
        if (feeFilter === 'free') {
            filtered = filtered.filter(e => !e.fee || e.fee === 0);
        } else if (feeFilter === 'paid') {
            filtered = filtered.filter(e => e.fee && e.fee > 0);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.name.toLowerCase().includes(query) ||
                e.description.toLowerCase().includes(query) ||
                e.location.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
            } else if (sortBy === 'oldest') {
                return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
            } else { // starting-soon
                const now = new Date().getTime();
                const aDiff = Math.abs(new Date(a.start_date).getTime() - now);
                const bDiff = Math.abs(new Date(b.start_date).getTime() - now);
                return aDiff - bDiff;
            }
        });

        return filtered;
    }, [publishedEvents, feeFilter, sortBy, searchQuery]);

    // Track page loading state for skeleton display during navigation
    useEffect(() => {
        const handleStart = () => setIsPageLoading(true);
        const handleFinish = () => setIsPageLoading(false);

        router.on('start', handleStart);
        router.on('finish', handleFinish);

        return () => {
            router.on('start', handleStart);
            router.on('finish', handleFinish);
        };
    }, []);

    // Check for event_id URL parameter and open event dialog automatically
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('event_id');

        if (eventId) {
            const event = events.find((e) => e.id === parseInt(eventId));
            if (event) {
                // Defer state update to avoid cascading renders
                setTimeout(() => {
                    setSelectedEvent(event);
                }, 0);
                // Clean up URL without reloading
                window.history.replaceState({}, '', '/join-events');
            }
        }
    }, [events]);

    const handleCardClick = (event: Event, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }
        setSelectedEvent(event);
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

    const handleRegisterClick = (event: Event) => {
        const { status } = getParticipantStatus(event);

        // Allow action if status is null OR 'rejected' (so they can re-register)
        if (status && status !== 'rejected') {
            return;
        }

        // Reset payment states for a fresh attempt
        setPaymentProofFile(null);
        setPaymentProofPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        setConfirmRegisterEvent(event);
    };

    const handleConfirmRegister = () => {
        if (!confirmRegisterEvent) return;

        if (confirmRegisterEvent.fee && confirmRegisterEvent.fee > 0) {
            setPaymentProofEvent(confirmRegisterEvent);
            setConfirmRegisterEvent(null);
            setPaymentProofFile(null);
            setPaymentProofPreview(null);
        } else {
            handleRegister(confirmRegisterEvent.id);
            setConfirmRegisterEvent(null);
        }
    };

    const handleRegister = (eventId: number, paymentProof?: File) => {
        setProcessing(true);

        if (paymentProof) {
            const formData = new FormData();
            formData.append('payment_proof', paymentProof);

            router.post(`/events/${eventId}/register`, formData, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setPaymentProofEvent(null);
                    setPaymentProofFile(null);
                    setPaymentProofPreview(null);
                    setProcessing(false);
                    toast.success('Registration submitted successfully!', {
                        description: 'Your payment proof is being reviewed.',
                    });
                },
                onError: (errors) => {
                    setProcessing(false);
                    toast.error('Registration failed', {
                        description: Object.values(errors).flat().join(', ') || 'Please try again.',
                    });
                },
            });
        } else {
            router.post(`/events/${eventId}/register`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    toast.success('Registration successful!', {
                        description: 'You have been registered for this event.',
                    });
                },
                onError: (errors) => {
                    setProcessing(false);
                    toast.error('Registration failed', {
                        description: Object.values(errors).flat().join(', ') || 'Please try again.',
                    });
                },
            });
        }
    };

    // Updated: Triggers the Dialog instead of browser confirm
    const confirmUnregister = (participantId: number) => {
        setParticipantToUnregister(participantId);
    };

    // New: Executes the actual deletion
    const executeUnregister = () => {
        if (participantToUnregister) {
            router.delete(`/participants/${participantToUnregister}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedEvent(null);
                    setParticipantToUnregister(null);
                    toast.success('Unregistered successfully', {
                        description: 'You have been removed from this event.',
                    });
                },
                onError: () => {
                    toast.error('Failed to unregister', {
                        description: 'Please try again.',
                    });
                },
                onFinish: () => setParticipantToUnregister(null),
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setPaymentProofFile(file);
        if (file) {
            setPaymentProofPreview(URL.createObjectURL(file));
        }
    };

    const removePaymentProof = () => {
        setPaymentProofFile(null);
        setPaymentProofPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmitPaymentProof = () => {
        if (paymentProofEvent && paymentProofFile) {
            handleRegister(paymentProofEvent.id, paymentProofFile);
        }
    };

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100 shadow-sm">
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Registered
                    </Badge>
                );
            case 'pending':
            case 'pending':
            case 'pending_approval':
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100 shadow-sm">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Pending Approval
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100 shadow-sm">
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Rejected
                    </Badge>
                );
            default:
                return null;
        }
    };

    // Prominent ribbon for registered events (shows on card image)
    const getRegistrationRibbon = (status: string | null) => {
        if (!status) return null;
        
        if (status.toLowerCase() === 'approved') {
            return (
                <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-br-lg shadow-md flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    REGISTERED
                </div>
            );
        }
        if (status.toLowerCase() === 'pending' || status.toLowerCase() === 'pending_approval') {
            return (
                <div className="absolute top-0 left-0 bg-yellow-500 text-white px-3 py-1 text-xs font-bold rounded-br-lg shadow-md flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    PENDING
                </div>
            );
        }
        return null;
    };

    // Helper to get event availability status
    const getEventAvailabilityBadge = (event: Event, userStatus: string | null) => {
        const now = new Date();
        const endDate = new Date(event.end_date);
        const startDate = new Date(event.start_date);
        const isPast = endDate < now;
        const isOngoing = startDate <= now && endDate >= now;

        const totalParticipants = event.participants?.filter(
            p => p.status.toLowerCase() === 'approved' || p.status.toLowerCase() === 'pending' || p.status.toLowerCase() === 'pending_approval'
        ).length || 0;
        const isFull = event.capacity ? totalParticipants >= event.capacity : false;

        // If user is already registered, don't show availability badge
        if (userStatus === 'approved' || userStatus === 'pending' || userStatus === 'pending_approval') {
            return null;
        }

        if (isPast) {
            return (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Past
                </Badge>
            );
        }

        if (isFull) {
            return (
                <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                    Full
                </Badge>
            );
        }

        if (isOngoing) {
            return (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
                    Ongoing
                </Badge>
            );
        }

        // Event is open for registration
        return (
            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Open
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Join Events' />

            <div className='flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto'>
                {/* Header */}
                <div className='flex items-center gap-3'>
                    <div className='p-2 bg-primary/10 rounded-lg'>
                        <Users className='h-8 w-8 text-primary' />
                    </div>
                    <div>
                        <h1 className='text-3xl font-bold'>Join Events</h1>
                        <p className='text-muted-foreground'>
                            Explore and register for volunteering opportunities
                        </p>
                    </div>
                </div>

                {/* Filter and Sort Controls */}
                {publishedEvents.length > 0 && (
                    <Card className="bg-muted/30">
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-4">
                                {/* Search Bar */}
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="Search events by name, location, or description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    {searchQuery && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Filters and Sort */}
                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                                    {/* Fee Filter Buttons */}
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex gap-2">
                                            <Button
                                                variant={feeFilter === 'all' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setFeeFilter('all')}
                                            >
                                                All
                                            </Button>
                                            <Button
                                                variant={feeFilter === 'free' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setFeeFilter('free')}
                                                className={feeFilter === 'free' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                            >
                                                Free
                                            </Button>
                                            <Button
                                                variant={feeFilter === 'paid' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setFeeFilter('paid')}
                                                className={feeFilter === 'paid' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                                            >
                                                Paid
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Sort Dropdown */}
                                    <div className="flex items-center gap-2">
                                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="newest">Newest First</SelectItem>
                                                <SelectItem value="oldest">Oldest First</SelectItem>
                                                <SelectItem value="starting-soon">Starting Soon</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Results count */}
                                {(feeFilter !== 'all' || searchQuery) && (
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {filteredAndSortedEvents.length} of {publishedEvents.length} events
                                        </p>
                                        {(feeFilter !== 'all' || searchQuery) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setFeeFilter('all');
                                                    setSearchQuery('');
                                                }}
                                                className="gap-1"
                                            >
                                                <X className="h-3 w-3" />
                                                Clear filters
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Loading Skeleton */}
                {isPageLoading ? (
                    <EventCardsGridSkeleton count={6} />
                ) : publishedEvents.length === 0 ? (
                    /* Empty State with Illustration - No Events */
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                <CalendarX className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No Events Available</h3>
                            <p className="text-muted-foreground text-center max-w-md mb-6">
                                There are no events open for registration at the moment. Check back later for new volunteering opportunities!
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => router.reload()}
                                    className="gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Refresh
                                </Button>
                                <Button
                                    onClick={() => router.visit('/events-gallery')}
                                    className="gap-2"
                                >
                                    <ImageIcon className="h-4 w-4" />
                                    View Past Events
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : filteredAndSortedEvents.length === 0 ? (
                    /* Empty State - No Matching Events */
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Filter className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No Events Match Your Filters</h3>
                            <p className="text-muted-foreground text-center max-w-md mb-4">
                                Try adjusting your search query or filters to find more events.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery('');
                                    setFeeFilter('all');
                                    setSortBy('newest');
                                }}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Clear All Filters
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                        {filteredAndSortedEvents.map((event: Event) => {
                            const { status, participantId } = getParticipantStatus(event);
                            const totalParticipants = event.participants?.filter(p => p.status.toLowerCase() === 'approved' || p.status.toLowerCase() === 'pending' || p.status.toLowerCase() === 'pending_approval').length || 0;
                            const slotsLeft = event.capacity ? event.capacity - totalParticipants : 'Unlimited';
                            const isPaidEvent = event.fee && event.fee > 0;
                            const isFull = event.capacity ? totalParticipants >= event.capacity : false;

                            return (
                                <Card
                                    key={event.id}
                                    className={`hover:shadow-lg transition-all cursor-pointer flex flex-col h-full overflow-hidden ${
                                        status?.toLowerCase() === 'approved'
                                            ? 'border-green-300 bg-green-50/30 hover:border-green-400'
                                            : (status?.toLowerCase() === 'pending' || status?.toLowerCase() === 'pending_approval')
                                            ? 'border-yellow-300 bg-yellow-50/30 hover:border-yellow-400'
                                            : 'hover:border-primary/50'
                                    }`}
                                    onClick={(e) => handleCardClick(event, e)}
                                >
                                    {/* Card Header Area - Image or Placeholder */}
                                    <div className='relative h-48 overflow-hidden shrink-0'>
                                        {event.image_path ? (
                                            <img
                                                src={`/storage/${event.image_path}`}
                                                alt={event.name}
                                                className='w-full h-full object-cover'
                                            />
                                        ) : (
                                            /* Styled placeholder for events without images */
                                            <div className='w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 flex items-center justify-center'>
                                                <div className='text-center'>
                                                    <CalendarDays className='h-12 w-12 text-primary/30 mx-auto mb-2' />
                                                    <span className='text-xs text-muted-foreground/60 font-medium uppercase tracking-wider'>
                                                        {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {/* Registration ribbon (top-left) */}
                                        {getRegistrationRibbon(status)}
                                        {/* Event availability badge (top-right) */}
                                        <div className='absolute top-2 right-2'>
                                            {getEventAvailabilityBadge(event, status)}
                                        </div>
                                    </div>
                                    <CardHeader className='pb-2'>
                                        <CardTitle className='flex items-start justify-between gap-2'>
                                            <span className='line-clamp-1'>{event.name}</span>
                                            {isPaidEvent && (
                                                <span className='text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap'>
                                                    RM {Number(event.fee).toFixed(2)}
                                                </span>
                                            )}
                                        </CardTitle>
                                        <CardDescription className='line-clamp-2'>{event.description}</CardDescription>
                                    </CardHeader>
                                    
                                    <CardContent className='space-y-2 flex-1'>
                                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                            <CalendarDays className='h-4 w-4 flex-shrink-0' />
                                            <span>{new Date(event.start_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                            <MapPin className='h-4 w-4 flex-shrink-0' />
                                            <span className='line-clamp-1'>{event.location}</span>
                                        </div>
                                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                            <Users className='h-4 w-4 flex-shrink-0' />
                                            <span>
                                                {slotsLeft === 'Unlimited'
                                                    ? 'Unlimited slots'
                                                    : `${slotsLeft} ${slotsLeft === 1 ? 'slot' : 'slots'} left`
                                                }
                                            </span>
                                        </div>
                                    </CardContent>
                                    
                                    <CardFooter className='flex gap-2 mt-auto'> 
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={() => setSelectedEvent(event)}
                                            className='flex-1'
                                        >
                                            <Eye className='h-4 w-4 mr-1' />
                                            Details
                                        </Button>
                                        
                                        {/*Changed handleUnregister to confirmUnregister */}
                                        {status === 'approved' || status === 'pending' || status === 'pending_approval' ? (
                                            <Button
                                                variant='destructive'
                                                size='sm'
                                                onClick={() => participantId && confirmUnregister(participantId)}
                                                className='flex-1'
                                            >
                                                Unregister
                                            </Button>
                                        ) : (
                                            <Button
                                                size='sm'
                                                onClick={() => handleRegisterClick(event)}
                                                className={`flex-1 ${status === 'rejected' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                                                disabled={isFull && status !== 'rejected'} // Allow rejected to re-register even if "full" (optional policy, usually better to check capacity)
                                                variant='default'
                                            >
                                                {isFull && status !== 'rejected' ? 'Full' : (status === 'rejected' ? 'Re-register' : 'Register')}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Event Details Dialog */}
            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
                    {selectedEvent && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selectedEvent.name}</DialogTitle>
                            </DialogHeader>
                            {/* Event Poster */}
                            {selectedEvent.image_path && (
                                <div className="relative group mt-4">
                                    <img
                                        src={`/storage/${selectedEvent.image_path}`}
                                        alt={selectedEvent.name}
                                        className="
                                            w-full h-64 object-cover rounded-lg border 
                                            cursor-pointer transition-transform duration-200 
                                            hover:scale-[1.02]
                                        "
                                        onClick={() => setPosterPreviewOpen(true)}
                                    />

                                    <div
                                        className="
                                            absolute inset-0 
                                            bg-transparent group-hover:bg-black/20 
                                            transition-all duration-200 
                                            rounded-lg flex items-center justify-center 
                                            pointer-events-none
                                        "
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setPosterPreviewOpen(true)}
                                                className="relative z-20"
                                            >
                                                <ImageIcon className="h-4 w-4 mr-2" />
                                                View Full Size
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className='space-y-4'>
                                <div>
                                    <h3 className='font-semibold mb-2'>Description</h3>
                                    <p className='text-muted-foreground'>{selectedEvent.description}</p>
                                </div>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <h3 className='font-semibold mb-1'>Start Date</h3>
                                        <p className='text-sm text-muted-foreground'>
                                            {new Date(selectedEvent.start_date).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className='font-semibold mb-1'>End Date</h3>
                                        <p className='text-sm text-muted-foreground'>
                                            {new Date(selectedEvent.end_date).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className='font-semibold mb-1'>Location</h3>
                                        <p className='text-sm text-muted-foreground'>{selectedEvent.location}</p>
                                    </div>
                                    <div>
                                        <h3 className='font-semibold mb-1'>Capacity</h3>
                                        <p className='text-sm text-muted-foreground'>
                                            {selectedEvent.capacity || 'Unlimited'}
                                        </p>
                                    </div>
                                    {selectedEvent.fee && selectedEvent.fee > 0 && (
                                        <div>
                                            <h3 className='font-semibold mb-1'>Fee</h3>
                                            <p className='text-sm text-muted-foreground'>RM {Number(selectedEvent.fee).toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Status Alert Section */}
                                {(() => {
                                    const { status, participantId } = getParticipantStatus(selectedEvent);
                                    
                                    if (status) {
                                        return (
                                            <Alert className={status === 'rejected' ? 'border-red-200 bg-red-50' : ''}>
                                                <AlertDescription>
                                                    <div className='space-y-3'>
                                                        <div>
                                                            <p className='text-sm text-muted-foreground mb-2'>Your registration status:</p>
                                                            <div>{getStatusBadge(status)}</div>
                                                        </div>
                                                        
                                                        {(status === 'approved' || status === 'pending' || status === 'pending_approval') && (
                                                            <Button
                                                                variant='destructive'
                                                                size='sm'
                                                                onClick={() => participantId && confirmUnregister(participantId)}
                                                                className='w-full sm:w-auto'
                                                            >
                                                                Unregister from Event
                                                            </Button>
                                                        )}
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        );
                                    }

                                    return null;
                                })()}
                            </div>
                            <DialogFooter className='flex-col sm:flex-row gap-2'>
                                <Button variant='outline' onClick={() => setSelectedEvent(null)} className='w-full sm:w-auto'>
                                    Close
                                </Button>
                                {(() => {
                                    const { status } = getParticipantStatus(selectedEvent);
                                    const totalParticipants = selectedEvent.participants?.filter(p => p.status.toLowerCase() === 'approved' || p.status.toLowerCase() === 'pending' || p.status.toLowerCase() === 'pending_approval').length || 0;
                                    const isFull = selectedEvent.capacity ? totalParticipants >= selectedEvent.capacity : false;
                                    const isPaidEvent = selectedEvent.fee && selectedEvent.fee > 0;

                                    // Allow if not registered, OR if rejected (re-register)
                                    if ((!status || status === 'rejected') && (!isFull || status === 'rejected')) {
                                        return (
                                            <Button
                                                onClick={() => {
                                                    setSelectedEvent(null);
                                                    handleRegisterClick(selectedEvent);
                                                }}
                                                className={`w-full sm:w-auto ${status === 'rejected' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                                                variant='default'
                                            >
                                                {status === 'rejected' ? (
                                                    <><RotateCcw className="mr-2 h-4 w-4" /> Re-register</>
                                                ) : (
                                                    isPaidEvent ? `Register (RM ${Number(selectedEvent.fee).toFixed(2)})` : 'Register Now'
                                                )}
                                            </Button>
                                        );
                                    }
                                    return null;
                                })()}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Registration Confirmation Dialog */}
            <Dialog open={!!confirmRegisterEvent} onOpenChange={() => setConfirmRegisterEvent(null)}>
                <DialogContent className='max-w-md'>
                    {confirmRegisterEvent && (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {getParticipantStatus(confirmRegisterEvent).status === 'rejected' ? 'Confirm Re-registration' : 'Confirm Registration'}
                                </DialogTitle>
                                <DialogDescription>
                                    Please review the event details before registering.
                                </DialogDescription>
                            </DialogHeader>

                            <div className='space-y-3 py-4'>
                                <div>
                                    <p className='font-semibold text-sm text-muted-foreground'>Event</p>
                                    <p className='font-medium'>{confirmRegisterEvent.name}</p>
                                </div>
                                <div>
                                    <p className='font-semibold text-sm text-muted-foreground'>Date</p>
                                    <p className='text-sm'>{new Date(confirmRegisterEvent.start_date).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className='font-semibold text-sm text-muted-foreground'>Location</p>
                                    <p className='text-sm'>{confirmRegisterEvent.location}</p>
                                </div>
                                {confirmRegisterEvent.fee && confirmRegisterEvent.fee > 0 && (
                                    <div>
                                        <p className='font-semibold text-sm text-muted-foreground'>Fee</p>
                                        <p className='text-sm font-semibold text-blue-600'>RM {Number(confirmRegisterEvent.fee).toFixed(2)}</p>
                                    </div>
                                )}

                                <Alert>
                                    <AlertDescription className='text-xs'>
                                        {confirmRegisterEvent.fee && confirmRegisterEvent.fee > 0
                                            ? 'You will be asked to upload payment proof in the next step.'
                                            : 'By clicking "Confirm Registration", you agree to participate in this event.'
                                        }
                                    </AlertDescription>
                                </Alert>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant='outline'
                                    onClick={() => setConfirmRegisterEvent(null)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleConfirmRegister}
                                    className={getParticipantStatus(confirmRegisterEvent).status === 'rejected' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                                >
                                    {getParticipantStatus(confirmRegisterEvent).status === 'rejected' ? 'Re-register' : 'Confirm Registration'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Payment Proof Upload Dialog */}
            <Dialog open={!!paymentProofEvent} onOpenChange={() => setPaymentProofEvent(null)}>
                <DialogContent className='max-w-lg max-h-[90vh] overflow-hidden flex flex-col'>
                    {paymentProofEvent && (
                        <>
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle>Upload Payment Proof</DialogTitle>
                                <DialogDescription>
                                    Event fee: RM {Number(paymentProofEvent.fee).toFixed(2)}
                                </DialogDescription>
                            </DialogHeader>

                            <div className='flex-1 overflow-y-auto space-y-4 py-4'>
                                {paymentProofEvent.qr_code_path && (
                                    <div className='border rounded-lg p-4 bg-gray-50'>
                                        <Label className='text-sm font-semibold mb-3 block'>Scan QR Code to Make Payment:</Label>
                                        <div className="flex justify-center">
                                            <img
                                                src={`/storage/${paymentProofEvent.qr_code_path}`}
                                                alt='Payment QR Code'
                                                className='w-48 h-48 object-contain rounded-lg shadow-sm'
                                            />
                                        </div>
                                        <p className='text-xs text-center text-muted-foreground mt-3'>
                                            Scan this QR code with your banking app
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor='payment_proof'>Payment Proof *</Label>
                                    <Input
                                        id='payment_proof'
                                        type='file'
                                        accept='image/*'
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className='mt-2'
                                        required
                                    />
                                    <p className='text-xs text-muted-foreground mt-1'>
                                        Upload a screenshot of your payment receipt
                                    </p>
                                </div>

                                {paymentProofPreview && (
                                    <div className='border rounded-lg p-3 bg-muted/50'>
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className='text-sm font-semibold'>Preview:</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={removePaymentProof}
                                                className="h-8 w-8 p-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex justify-center">
                                            <img
                                                src={paymentProofPreview}
                                                alt='Payment proof preview'
                                                className='max-w-full h-32 object-contain rounded'
                                            />
                                        </div>
                                        {paymentProofFile && (
                                            <p className="text-xs text-muted-foreground text-center mt-2">
                                                {paymentProofFile.name} ({(paymentProofFile.size / 1024 / 1024).toFixed(2)} MB)
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="flex-shrink-0 gap-2">
                                <Button
                                    variant='outline'
                                    onClick={() => {
                                        setPaymentProofEvent(null);
                                        removePaymentProof();
                                    }}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitPaymentProof}
                                    disabled={!paymentProofFile || processing}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {processing ? 'Submitting...' : 'Submit Registration'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Unregistration Confirmation Dialog */}
            <AlertDialog open={!!participantToUnregister} onOpenChange={() => setParticipantToUnregister(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unregister from Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unregister from this event? 
                            If this is a paid event, your payment might not be refundable immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={executeUnregister}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Unregister
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Poster Preview Modal */}
            {selectedEvent?.image_path && (
                <Dialog open={posterPreviewOpen} onOpenChange={setPosterPreviewOpen}>
                    <DialogContent className='max-w-5xl max-h-[95vh] p-2'>
                        <DialogHeader>
                            <DialogTitle>{selectedEvent.name} - Poster</DialogTitle>
                        </DialogHeader>
                        <div className='flex items-center justify-center overflow-auto max-h-[80vh]'>
                            <img
                                src={`/storage/${selectedEvent.image_path}`}
                                alt={selectedEvent.name}
                                className='max-w-full max-h-full object-contain rounded-lg'
                            />
                        </div>
                        <DialogFooter>
                            <Button variant='outline' onClick={() => setPosterPreviewOpen(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
}