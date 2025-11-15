import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Eye, ImageIcon, CheckCircle, Users, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { JoinEventsPageProps } from '@/types/JoinEvents';
import { Event } from '@/types/Event';

// Define Participant type locally
type Participant = {
    id: number;
    user_id: number;
    event_id: number;
    status: string;
    registration_date: string;
    last_updated: string;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Join Events', href: '/join-events' }];

export default function JoinEvents() {
    const { events, auth } = usePage<JoinEventsPageProps>().props;
    const { user } = auth;

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const handleRegister = (eventId: number) => {
        router.post(`/events/${eventId}/register`, {}, {
            onSuccess: () => setSelectedEvent(null),
        });
    };

    const handleUnregister = (participantId: number) => {
        router.delete(`/participants/${participantId}`, {
            onSuccess: () => setSelectedEvent(null),
        });
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

                <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                    {events.map((event: Event) => {
                        const { status } = getParticipantStatus(event);
                        const totalParticipants = event.participants?.length || 0;
                        const slotsLeft = event.capacity ? event.capacity - totalParticipants : 'Unlimited';

                        return (
                            <Card
                                key={event.id}
                                className='overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 rounded-xl'
                            >
                                {event.image_path ? (
                                    <img
                                        src={`/storage/${event.image_path}`}
                                        alt={event.name}
                                        className='aspect-[16/9] w-full object-cover'
                                    />
                                ) : (
                                    <div className='aspect-[16/9] bg-gray-200 flex items-center justify-center text-gray-500'>
                                        <ImageIcon className='h-8 w-8' />
                                    </div>
                                )}

                                <CardHeader>
                                    <CardTitle className='text-lg font-semibold'>{event.name}</CardTitle>
                                    <CardDescription className='flex items-center gap-2 text-sm text-muted-foreground'>
                                        <CalendarDays className='h-4 w-4' />
                                        {new Date(event.start_date).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <p className='text-sm text-muted-foreground mb-2'>
                                        <MapPin className='inline-block h-4 w-4 mr-1 text-muted-foreground' />
                                        {event.location}
                                    </p>
                                    <p className='text-sm text-muted-foreground line-clamp-2'>{event.description}</p>
                                </CardContent>

                                <CardFooter className='flex justify-between items-center'>
                                    <span className={`text-xs font-medium ${typeof slotsLeft === 'number' && slotsLeft > 0 || slotsLeft === 'Unlimited' ? 'text-green-600' : 'text-red-500'}`}>
                                        {slotsLeft} slots left
                                    </span>

                                    {user && status ? (
                                        <Button size='sm' disabled variant='outline'>
                                            {status === 'APPROVED' && <CheckCircle className='mr-2 h-4 w-4 text-green-500' />}
                                            {status === 'PENDING' && <CheckCircle className='mr-2 h-4 w-4 text-yellow-500' />}
                                            {status}
                                        </Button>
                                    ) : (
                                        <Button size='sm' variant='outline' onClick={() => setSelectedEvent(event)}>
                                            <Eye className='mr-2 h-4 w-4' /> View Details
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent className='sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle>{selectedEvent?.name}</DialogTitle>
                        <DialogDescription>
                            {selectedEvent?.start_date} — {selectedEvent?.location}
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-3'>
                        {selectedEvent?.image_path ? (
                            <img
                                src={`/storage/${selectedEvent.image_path}`}
                                alt={selectedEvent.name}
                                className='aspect-[16/9] w-full object-cover rounded-md'
                            />
                        ) : (
                            <div className='aspect-[16/9] bg-gray-200 flex items-center justify-center text-gray-500 rounded-md'>
                                <ImageIcon className='h-8 w-8' />
                            </div>
                        )}

                        <p className='text-sm text-gray-700'>{selectedEvent?.description}</p>

                        <p className='text-xs text-gray-500'>
                            Available slots:{' '}
                            <span className='font-medium text-green-600'>
                                {selectedEvent?.capacity ? selectedEvent.capacity - (selectedEvent.participants?.length || 0) : 'Unlimited'}
                            </span>
                        </p>
                    </div>

                    <DialogFooter className='flex justify-end space-x-2'>
                        <Button variant='outline' onClick={() => setSelectedEvent(null)}>
                            Close
                        </Button>
                        {selectedEvent && user && (() => {
                            const { status, participantId } = getParticipantStatus(selectedEvent);
                            if (status && participantId) {
                                return (
                                    <Button variant='destructive' onClick={() => handleUnregister(participantId)}>
                                        <XCircle className='mr-2 h-4 w-4' /> Unregister
                                    </Button>
                                );
                            }
                            return (
                                <Button onClick={() => handleRegister(selectedEvent.id)}>
                                    <CheckCircle className='mr-2 h-4 w-4' /> Register
                                </Button>
                            );
                        })()}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}