import React, { useState, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Eye, ImageIcon, CheckCircle, Users, XCircle, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    const [paymentProofEvent, setPaymentProofEvent] = useState<Event | null>(null);
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const publishedEvents = events.filter((event: Event) => event.status === 'published');

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Join Volunteering Events' />

            <div className='flex flex-col gap-6 p-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <Users className='h-6 w-6 text-muted-foreground' />
                        <h1 className='text-2xl font-semibold'>Join Volunteering Events</h1>
                    </div>
                </div>

                {publishedEvents.length === 0 ? (
                    <div className='text-center py-12'>
                        <p className='text-muted-foreground text-lg'>No events available at the moment.</p>
                        <p className='text-sm text-muted-foreground mt-2'>Check back later for new volunteering opportunities!</p>
                    </div>
                ) : (
                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                        {publishedEvents.map((event: Event) => {
                            const { status, participantId } = getParticipantStatus(event);
                            const totalParticipants = event.participants?.filter(p => p.status === 'approved' || p.status === 'pending_approval').length || 0;
                            const slotsLeft = event.capacity ? event.capacity - totalParticipants : 'Unlimited';
                            const isPaidEvent = event.fee && event.fee > 0;

                            return (
                                <Card key={event.id} className='hover:shadow-lg transition-shadow'>
                                    {event.image_path && (
                                        <div className='relative h-48 overflow-hidden rounded-t-lg'>
                                            <img
                                                src={`/storage/${event.image_path}`}
                                                alt={event.name}
                                                className='w-full h-full object-cover'
                                            />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle className='flex items-start justify-between'>
                                            <span>{event.name}</span>
                                            {isPaidEvent && (
                                                <span className='text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded'>
                                                    RM {Number(event.fee).toFixed(2)}
                                                </span>
                                            )}
                                        </CardTitle>
                                        <CardDescription className='line-clamp-2'>{event.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className='space-y-2'>
                                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                            <CalendarDays className='h-4 w-4' />
                                            <span>{new Date(event.start_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                            <MapPin className='h-4 w-4' />
                                            <span>{event.location}</span>
                                        </div>
                                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                            <Users className='h-4 w-4' />
                                            <span>Slots: {slotsLeft === 'Unlimited' ? slotsLeft : `${slotsLeft} left`}</span>
                                        </div>
                                        {status && (
                                            <div className='pt-2 border-t'>
                                                {getStatusBadge(status)}
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className='flex gap-2'>
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={() => setSelectedEvent(event)}
                                            className='flex-1'
                                        >
                                            <Eye className='h-4 w-4 mr-1' />
                                            View Details
                                        </Button>
                                        {status === 'approved' || status === 'pending_approval' ? (
                                            <Button
                                                variant='destructive'
                                                size='sm'
                                                onClick={() => participantId && handleUnregister(participantId)}
                                                className='flex-1'
                                            >
                                                Unregister
                                            </Button>
                                        ) : status === 'rejected' ? (
                                            <Button variant='secondary' size='sm' disabled className='flex-1'>
                                                Registration Rejected
                                            </Button>
                                        ) : (
                                            <Button
                                                size='sm'
                                                onClick={() => handleRegisterClick(event)}
                                                className='flex-1'
                                                disabled={event.capacity ? totalParticipants >= event.capacity : false}
                                            >
                                                {isPaidEvent ? 'Register (Paid)' : 'Register'}
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
                            </div>
                            <DialogFooter>
                                <Button variant='outline' onClick={() => setSelectedEvent(null)}>
                                    Close
                                </Button>
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