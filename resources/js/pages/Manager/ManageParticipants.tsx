// resources/js/Pages/Manager/ManageParticipants.tsx
import React, { useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, Users } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Participant {
    id: number;
    user_id: number;
    event_id: number;
    status: string;
    registration_date: string;
    user: User;
}

interface Event {
    id: number;
    name: string;
    location: string;
    start_date: string;
    capacity?: number;
}

interface ManageParticipantsProps {
    event: Event;
    participants: Participant[];
}

export default function ManageParticipants({ event, participants }: ManageParticipantsProps) {

    const handleStatusChange = (participantId: number, status: 'APPROVED' | 'REJECTED') => {
        router.put(`/participants/${participantId}/status`, { status }, {
            preserveScroll: true,
        });
    };

    // Separate participants by status
    const pendingParticipants = participants.filter(p => p.status.toLowerCase() === 'pending');
    const approvedParticipants = participants.filter(p => p.status.toLowerCase() === 'approved');
    const rejectedParticipants = participants.filter(p => p.status.toLowerCase() === 'rejected');

    // Calculate statistics
    const totalParticipants = participants.length;

    // State for active tab
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    const ParticipantTable = ({ participants, showActions = true }: { participants: Participant[], showActions?: boolean }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Status</TableHead>
                    {showActions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {participants.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={showActions ? 5 : 4} className="text-center text-muted-foreground py-8">
                            No participants in this category
                        </TableCell>
                    </TableRow>
                ) : (
                    participants.map((participant) => (
                        <TableRow key={participant.id}>
                            <TableCell className="font-medium">{participant.user.name}</TableCell>
                            <TableCell>{participant.user.email}</TableCell>
                            <TableCell>
                                {participant.registration_date 
                                    ? new Date(participant.registration_date).toLocaleDateString()
                                    : 'N/A'
                                }
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        participant.status.toLowerCase() === 'approved'
                                            ? 'default'
                                            : participant.status.toLowerCase() === 'rejected'
                                            ? 'destructive'
                                            : 'outline'
                                    }
                                >
                                    {participant.status.charAt(0).toUpperCase() + participant.status.slice(1).toLowerCase()}
                                </Badge>
                            </TableCell>
                            {showActions && (
                                <TableCell className="text-right">
                                    {participant.status.toLowerCase() !== 'approved' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleStatusChange(participant.id, 'APPROVED')}
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        >
                                            Approve
                                        </Button>
                                    )}
                                    {participant.status.toLowerCase() !== 'rejected' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleStatusChange(participant.id, 'REJECTED')}
                                            className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            Reject
                                        </Button>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    return (
        <AppLayout>
            <Head title={`Manage Participants for ${event.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Event Header */}
                    <div className="bg-background overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">{event.name}</h2>
                                    <p className="text-muted-foreground">{event.location} • {new Date(event.start_date).toLocaleDateString()}</p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={() => router.get('/events')}
                                >
                                    Back to Events
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalParticipants}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                                <Clock className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{pendingParticipants.length}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{approvedParticipants.length}</div>
                                {event.capacity && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {event.capacity - approvedParticipants.length} slots remaining
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                                <XCircle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{rejectedParticipants.length}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Participants Tabs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Participants Management</CardTitle>
                            <CardDescription>View and manage participant registrations by status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Tab Navigation */}
                            <div className="flex space-x-2 mb-6 border-b">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        activeTab === 'all'
                                            ? 'border-b-2 border-primary text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    All ({totalParticipants})
                                </button>
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={`px-4 py-2 font-medium transition-colors relative ${
                                        activeTab === 'pending'
                                            ? 'border-b-2 border-primary text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Pending ({pendingParticipants.length})
                                    {pendingParticipants.length > 0 && (
                                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-yellow-500"></span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('approved')}
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        activeTab === 'approved'
                                            ? 'border-b-2 border-primary text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Approved ({approvedParticipants.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('rejected')}
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        activeTab === 'rejected'
                                            ? 'border-b-2 border-primary text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Rejected ({rejectedParticipants.length})
                                </button>
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'all' && <ParticipantTable participants={participants} />}
                            {activeTab === 'pending' && <ParticipantTable participants={pendingParticipants} />}
                            {activeTab === 'approved' && <ParticipantTable participants={approvedParticipants} showActions={false} />}
                            {activeTab === 'rejected' && <ParticipantTable participants={rejectedParticipants} showActions={false} />}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}