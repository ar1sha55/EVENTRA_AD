import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDays, Bell, BarChart3, MapPin, Users, CheckCircle, XCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
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
};

interface DashboardProps {
  upcomingEvents?: Event[];
  notificationEvents?: NotificationEvent[];
  stats?: Stats;
}

export default function Dashboard({ upcomingEvents = [], notificationEvents = [], stats = { totalEvents: 0, upcomingEventsCount: 0 } }: DashboardProps) {
  const page = usePage();
  const auth = page.props.auth as { user: User };
  const { user } = auth;

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
        },
        onError: () => {
          setProcessing(false);
        },
      });
    } else {
      router.post(`/events/${eventId}/register`, {}, {
        preserveScroll: true,
        onSuccess: () => {
          setProcessing(false);
        },
        onError: () => {
          setProcessing(false);
        },
      });
    }
  };

  const handleUnregister = (participantId: number) => {
    router.delete(`/participants/${participantId}`, {
      onSuccess: () => setSelectedEvent(null),
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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <span className="text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Registered</span>;
      case 'pending_approval':
        return <span className="text-yellow-600 font-semibold">⏳ Pending Approval</span>;
      case 'rejected':
        return <span className="text-red-600 font-semibold flex items-center gap-1"><XCircle className="h-4 w-4" /> Rejected</span>;
      default:
        return null;
    }
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

  // Top stats configuration
  const topStats = [
    { title: 'Total Events', value: stats.totalEvents, icon: <CalendarDays className="h-4 w-4 text-muted-foreground" />, desc: 'All registered events' },
    { title: 'Upcoming Events', value: stats.upcomingEventsCount, icon: <CalendarDays className="h-4 w-4 text-muted-foreground" />, desc: 'Published events' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

        {/* Top Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          {topStats.map((stat, idx) => (
            <Card key={idx} className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
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
                      {selectedEvent.participants?.filter(p => p.status === 'approved' || p.status === 'pending_approval').length || 0}
                      {selectedEvent.capacity ? ` / ${selectedEvent.capacity}` : ''}
                    </p>
                  </div>
                </div>
                {(() => {
                  const { status } = getParticipantStatus(selectedEvent);
                  return status && (
                    <div className='pt-2 border-t'>
                      <h3 className='font-semibold mb-2'>Registration Status</h3>
                      {getStatusBadge(status)}
                    </div>
                  );
                })()}
              </div>
              <DialogFooter className='gap-2'>
                <Button variant='outline' onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
                {(() => {
                  const { status, participantId } = getParticipantStatus(selectedEvent);
                  const totalParticipants = selectedEvent.participants?.filter(p => p.status === 'approved' || p.status === 'pending_approval').length || 0;
                  const isPaidEvent = selectedEvent.fee && selectedEvent.fee > 0;

                  if (status === 'approved' || status === 'pending_approval') {
                    return (
                      <Button
                        variant='destructive'
                        onClick={() => participantId && handleUnregister(participantId)}
                      >
                        Unregister
                      </Button>
                    );
                  } else if (status === 'rejected') {
                    return (
                      <Button variant='secondary' disabled>
                        Registration Rejected
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
