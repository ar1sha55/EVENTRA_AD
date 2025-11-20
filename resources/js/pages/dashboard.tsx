import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDays, Bell, BarChart3, MapPin, Award, Clock } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
];

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
}

interface NotificationEvent {
  id: number;
  name: string;
  start_date: string;
}

interface Stats {
  totalEvents: number;
  upcomingEventsCount: number;
}

type User = {
  id: number;
  name: string;
  email: string;
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
}

interface DashboardProps {
  upcomingEvents?: Event[];
  notificationEvents?: NotificationEvent[];
  stats?: Stats;
  topVolunteers?: TopVolunteer[];
}

export default function Dashboard({ upcomingEvents = [], notificationEvents = [], stats = { totalEvents: 0, upcomingEventsCount: 0 }, topVolunteers = [] }: DashboardProps) {
  const page = usePage();
  const auth = page.props.auth as { user: User };
  const { user } = auth;

  // Helper functions
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  // Function to calculate and format countdown
  const getCountdown = (startDate: string) => {
    const now = new Date();
    const eventDate = new Date(startDate);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: 'Today!', color: 'text-red-600 font-semibold' };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'text-orange-600 font-semibold' };
    } else if (diffDays <= 7) {
      return { text: `in ${diffDays} days`, color: 'text-orange-500' };
    } else if (diffDays <= 14) {
      const weeks = Math.floor(diffDays / 7);
      return { text: `in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`, color: 'text-blue-600' };
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return { text: `in ${weeks} weeks`, color: 'text-blue-500' };
    } else {
      const months = Math.floor(diffDays / 30);
      return { text: `in ${months} ${months === 1 ? 'month' : 'months'}`, color: 'text-gray-600' };
    }
  };

  const handleRegisterClick = (event: Event) => {
    // If event has a fee, show payment proof upload dialog
    if (event.fee && event.fee > 0) {
      setPaymentProofEvent(event);
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
    } else {
      // Free event - register immediately
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

      // Update selectedEvent with optimistic update - add pending participant
      if (selectedEvent) {
        const newParticipant: Participant = {
          id: Date.now(), // Temporary ID
          user_id: user.id,
          event_id: eventId,
          status: 'pending_approval',
          registration_date: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        };

        setSelectedEvent({
          ...selectedEvent,
          participants: [...(selectedEvent.participants || []), newParticipant]
        });
      }
    };

    if (paymentProof) {
      const formData = new FormData();
      formData.append('payment_proof', paymentProof);

      router.post(`/events/${eventId}/register`, formData, {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: handleSuccess,
        onError: () => {
          setProcessing(false);
        },
      });
    } else {
      router.post(`/events/${eventId}/register`, {}, {
        preserveScroll: true,
        onSuccess: handleSuccess,
        onError: () => {
          setProcessing(false);
        },
      });
    }
  };

  const handleUnregister = (participantId: number) => {
    router.delete(`/participants/${participantId}`, {
      preserveScroll: true,
      onSuccess: () => {
        // Update selectedEvent by removing the participant
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
      status: participant ? participant.status : null,
      participantId: participant ? participant.id : null,
    };
  };

  // Past events stats (for chart)
  const pastEventsStats = [
    { name: "Jan", events: 2 },
    { name: "Feb", events: 4 },
    { name: "Mar", events: 3 },
    { name: "Apr", events: 5 },
    { name: "May", events: 4 },
    { name: "Jun", events: 6 },
  ];

  // Top stats configuration with colors
  const topStats = [
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: <CalendarDays className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      desc: 'All registered events',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-900 dark:text-blue-100'
    },
    {
      title: 'Upcoming Events',
      value: stats.upcomingEventsCount,
      icon: <CalendarDays className="h-8 w-8 text-green-600 dark:text-green-400" />,
      desc: 'Published events',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-900 dark:text-green-100'
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

        {/* Greeting */}
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-500 bg-clip-text text-transparent">
            Hi, {user.name}!
          </h1>
          <span className="text-3xl animate-wave">👋</span>
        </div>

        {/* Top Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          {topStats.map((stat, idx) => (
            <Card key={idx} className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${stat.bgColor} ${stat.borderColor}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className={`text-sm font-medium ${stat.textColor}`}>{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${stat.textColor}`}>{stat.value}</div>
                <p className={`text-xs ${stat.textColor} opacity-70`}>{stat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming Events & Notifications */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Upcoming Events */}
          <Card className="lg:col-span-2">
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle>Upcoming Events</CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-all hover:bg-muted/40 cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold">{event.name}</span>
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(event.start_date).toLocaleDateString('en-MY', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    </div>
                    {event.fee && event.fee > 0 && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        RM {Number(event.fee).toFixed(2)}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming events at the moment.</p>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationEvents.length > 0 ? (
                notificationEvents.map((event) => {
                  const countdown = getCountdown(event.start_date);
                  return (
                    <div key={event.id} className="flex items-start gap-3 rounded-lg border p-3 transition-all hover:bg-muted/40">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {event.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.start_date).toLocaleDateString('en-MY', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className={`text-xs font-medium ${countdown.color}`}>
                          {countdown.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Past Events Chart & Top Volunteers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Past Events Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                Past Events Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pastEventsStats}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="events" fill="#f97316" radius={[5,5,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Volunteers */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Top Volunteers
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Most hours logged by participants</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topVolunteers && topVolunteers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No volunteer hours logged yet
                  </p>
                ) : (
                  topVolunteers?.slice(0, 5).map((volunteer, index) => (
                    <div
                      key={volunteer.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 ${getMedalBgColor(index)} transition-all hover:shadow-md`}
                    >
                      {/* Rank Badge */}
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMedalColor(index)} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md`}>
                        {index + 1}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        {volunteer.profile_picture ? (
                          <AvatarImage
                            src={`/storage/${volunteer.profile_picture}`}
                            alt={volunteer.name}
                          />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                          {getInitials(volunteer.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Volunteer Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{volunteer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {volunteer.faculty || 'No faculty'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {volunteer.events_participated} {volunteer.events_participated === 1 ? 'event' : 'events'}
                        </p>
                      </div>

                      {/* Hours Badge */}
                      <div className="flex flex-col items-end">
                        <Badge variant="outline" className="bg-white border-2 font-bold whitespace-nowrap">
                          <Clock className="h-3 w-3 mr-1" />
                          {volunteer.total_hours} hrs
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.name}</DialogTitle>
              </DialogHeader>
              {selectedEvent.image_path && (
                <img
                  src={`/storage/${selectedEvent.image_path}`}
                  alt={selectedEvent.name}
                  className='w-full h-64 object-cover rounded-lg'
                />
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
                      {new Date(selectedEvent.start_date).toLocaleString('en-MY')}
                    </p>
                  </div>
                  <div>
                    <h3 className='font-semibold mb-1'>End Date</h3>
                    <p className='text-sm text-muted-foreground'>
                      {selectedEvent.end_date ? new Date(selectedEvent.end_date).toLocaleString('en-MY') : 'N/A'}
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
                  <div>
                    <h3 className='font-semibold mb-1'>Participants</h3>
                    <p className='text-sm text-muted-foreground'>
                      {selectedEvent.participants?.length || 0}
                      {selectedEvent.capacity ? ` / ${selectedEvent.capacity}` : ''}
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter className='gap-2'>
                <Button variant='outline' onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
                {(() => {
                  const { participantId } = getParticipantStatus(selectedEvent);
                  const totalParticipants = selectedEvent.participants?.length || 0;
                  const isPaidEvent = selectedEvent.fee && selectedEvent.fee > 0;

                  if (participantId) {
                    return (
                      <Button
                        variant='destructive'
                        onClick={() => handleUnregister(participantId)}
                      >
                        Unregister
                      </Button>
                    );
                  } else {
                    return (
                      <Button
                        onClick={() => handleRegisterClick(selectedEvent)}
                        disabled={selectedEvent.capacity ? totalParticipants >= selectedEvent.capacity : false}
                      >
                        {isPaidEvent ? 'Register (Paid)' : 'Register'}
                      </Button>
                    );
                  }
                })()}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Proof Upload Dialog */}
      <Dialog open={!!paymentProofEvent} onOpenChange={() => setPaymentProofEvent(null)}>
        <DialogContent className='max-w-md'>
          {paymentProofEvent && (
            <>
              <DialogHeader>
                <DialogTitle>Upload Payment Proof</DialogTitle>
                <DialogDescription>
                  This is a paid event (RM {Number(paymentProofEvent.fee).toFixed(2)}). Please scan the QR code to make payment, then upload your payment proof to complete registration.
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4'>
                {paymentProofEvent.qr_code_path && (
                  <div className='border rounded-lg p-4 bg-gray-50'>
                    <Label className='text-sm font-semibold mb-3 block'>Scan QR Code to Make Payment:</Label>
                    <img
                      src={`/storage/${paymentProofEvent.qr_code_path}`}
                      alt='Payment QR Code'
                      className='w-full max-w-xs mx-auto rounded-lg shadow-sm'
                    />
                    <p className='text-xs text-center text-muted-foreground mt-3'>
                      Scan this QR code with your banking app to make payment
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
                    Upload a screenshot or photo of your payment receipt after making payment
                  </p>
                </div>

                {paymentProofPreview && (
                  <div className='border rounded-lg p-2'>
                    <Label className='text-sm font-semibold mb-2 block'>Preview:</Label>
                    <img
                      src={paymentProofPreview}
                      alt='Payment proof preview'
                      className='w-full h-48 object-contain rounded'
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setPaymentProofEvent(null)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitPaymentProof}
                  disabled={!paymentProofFile || processing}
                >
                  {processing ? 'Submitting...' : 'Submit Registration'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
