import React, { useState, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Eye, ImageIcon, CheckCircle, Users, XCircle, Upload, X, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    
    // State for unregistration confirmation
    const [participantToUnregister, setParticipantToUnregister] = useState<number | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const publishedEvents = events.filter((event: Event) => event.status === 'published');

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
            status: participant ? participant.status : null,
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
                return <span className="text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Registered</span>;
            case 'pending_approval':
                return <span className="text-yellow-600 font-semibold flex items-center gap-1"><Upload className="h-4 w-4" /> Pending Approval</span>;
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
                            const isFull = event.capacity ? totalParticipants >= event.capacity : false;

                            return (
                                <Card
                                    key={event.id}
                                    className='hover:shadow-lg transition-all cursor-pointer hover:border-primary/50 flex flex-col h-full'
                                    onClick={(e) => handleCardClick(event, e)}
                                >
                                    {event.image_path && (
                                        <div className='relative h-48 overflow-hidden rounded-t-lg shrink-0'> 
                                            <img
                                                src={`/storage/${event.image_path}`}
                                                alt={event.name}
                                                className='w-full h-full object-cover'
                                            />
                                            {isFull && !status && (
                                                <div className='absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold'>
                                                    FULL
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <CardHeader>
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
                                        {status && (
                                            <div className='pt-2 border-t mt-auto'>
                                                {getStatusBadge(status)}
                                            </div>
                                        )}
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
                                        
                                        {/* FIXED: Changed handleUnregister to confirmUnregister */}
                                        {status === 'approved' || status === 'pending_approval' ? (
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
                                                        
                                                        {(status === 'approved' || status === 'pending_approval') && (
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
                                    const totalParticipants = selectedEvent.participants?.filter(p => p.status === 'approved' || p.status === 'pending_approval').length || 0;
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