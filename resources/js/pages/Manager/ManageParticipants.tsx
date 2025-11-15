// resources/js/Pages/Manager/ManageParticipants.tsx
import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event, Participant } from '@/types';

interface ManageParticipantsProps {
    event: Event;
    participants: Participant[];
}

export default function ManageParticipants({ event, participants }: ManageParticipantsProps) {

    const handleStatusChange = (participantId: number, status: 'approved' | 'rejected') => {
        router.put(`/participants/${participantId}/status`, { status }, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <Head title={`Manage Participants for ${event.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-background overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-foreground">
                            <h2 className="text-2xl font-bold mb-4">{event.name} - Participants</h2>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.map((participant) => (
                                        <TableRow key={participant.id}>
                                            <TableCell>{participant.user.name}</TableCell>
                                            <TableCell>{participant.user.email}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        participant.status === 'approved'
                                                            ? 'default'
                                                            : participant.status === 'rejected'
                                                            ? 'destructive'
                                                            : 'outline'
                                                    }
                                                >
                                                    {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {participant.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleStatusChange(participant.id, 'approved')}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleStatusChange(participant.id, 'rejected')}
                                                            className="ml-2"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
