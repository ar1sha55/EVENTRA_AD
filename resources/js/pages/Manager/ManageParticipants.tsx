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
import { Clock, CheckCircle, XCircle, Users, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
    payment_proof_path?: string;
    registration_date: string;
    user: User;
}

interface Event {
    id: number;
    name: string;
    location: string;
    start_date: string;
    capacity?: number;
    fee?: number;
}

interface ManageParticipantsProps {
    event: Event;
    participants: Participant[];
}

export default function ManageParticipants({ event, participants }: ManageParticipantsProps) {
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    const [paymentProofDialog, setPaymentProofDialog] = useState(false);

    const handleStatusChange = (participantId: number, status: 'approved' | 'rejected') => {
        router.put(`/participants/${participantId}/status`, { status }, {
            preserveScroll: true,
            onSuccess: () => {
                setPaymentProofDialog(false);
                setSelectedParticipant(null);
            },
        });
    };

    const viewPaymentProof = (participant: Participant) => {
        setSelectedParticipant(participant);
        setPaymentProofDialog(true);
    };

    // Separate participants by status (normalize to lowercase for comparison)
    const pendingParticipants = participants.filter(p => p.status.toLowerCase() === 'pending' || p.status.toLowerCase() === 'pending_approval');
    const approvedParticipants = participants.filter(p => p.status.toLowerCase() === 'approved');
    const rejectedParticipants = participants.filter(p => p.status.toLowerCase() === 'rejected');

    // Calculate statistics
    const totalParticipants = participants.length;

    // State for active tab
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    const isPaidEvent = event.fee && event.fee > 0;

    const ParticipantTable = ({ participants, showActions = true }: { participants: Participant[], showActions?: boolean }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Status</TableHead>
                    {isPaidEvent && <TableHead>Payment Proof</TableHead>}
                    {showActions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {participants.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={isPaidEvent ? (showActions ? 6 : 5) : (showActions ? 5 : 4)} className="text-center text-muted-foreground py-8">
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
                                    {participant.status.charAt(0).toUpperCase() + participant.status.slice(1).toLowerCase().replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            {isPaidEvent && (
                                <TableCell>
                                    {participant.payment_proof_path ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => viewPaymentProof(participant)}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View Proof
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">No proof</span>
                                    )}
                                </TableCell>
                            )}
                            {showActions && (
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {participant.status.toLowerCase() !== 'approved' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleStatusChange(participant.id, 'approved')}
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                        )}
                                        {participant.status.toLowerCase() !== 'rejected' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleStatusChange(participant.id, 'rejected')}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    const getStatusBadge = (status: string) => {
        const normalizedStatus = status.toLowerCase();
        switch (normalizedStatus) {
            case 'approved':
                return <Badge className="bg-green-500">Approved</Badge>;
            case 'pending':
            case 'pending_approval':
                return <Badge className="bg-yellow-500">Pending Approval</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

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
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                        <span>{event.location} • {new Date(event.start_date).toLocaleDateString()}</span>
                                        {isPaidEvent && (
                                            <span className="text-blue-600 font-semibold">
                                                Fee: RM {Number(event.fee).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
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
                                {isPaidEvent && pendingParticipants.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Awaiting payment verification
                                    </p>
                                )}
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
                            <CardDescription>
                                View and manage participant registrations by status
                                {isPaidEvent && ' - Verify payment proofs before approval'}
                            </CardDescription>
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

            {/* Payment Proof Dialog */}
            <Dialog open={paymentProofDialog} onOpenChange={setPaymentProofDialog}>
                <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
                    {selectedParticipant && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Payment Proof Verification</DialogTitle>
                                <DialogDescription>
                                    Review the payment proof submitted by {selectedParticipant.user.name}
                                </DialogDescription>
                            </DialogHeader>

                            <div className='space-y-4'>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <h3 className='font-semibold mb-1'>Participant Name</h3>
                                        <p className='text-sm text-muted-foreground'>{selectedParticipant.user.name}</p>
                                    </div>
                                    <div>
                                        <h3 className='font-semibold mb-1'>Email</h3>
                                        <p className='text-sm text-muted-foreground'>{selectedParticipant.user.email}</p>
                                    </div>
                                    <div>
                                        <h3 className='font-semibold mb-1'>Registration Date</h3>
                                        <p className='text-sm text-muted-foreground'>
                                            {new Date(selectedParticipant.registration_date).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className='font-semibold mb-1'>Current Status</h3>
                                        <div>{getStatusBadge(selectedParticipant.status)}</div>
                                    </div>
                                    {event.fee && event.fee > 0 && (
                                        <div>
                                            <h3 className='font-semibold mb-1'>Event Fee</h3>
                                            <p className='text-sm text-muted-foreground'>RM {Number(event.fee).toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>

                                {selectedParticipant.payment_proof_path && (
                                    <div className='border rounded-lg p-4 bg-gray-50'>
                                        <h3 className='font-semibold mb-3'>Payment Proof</h3>
                                        <img
                                            src={`/storage/${selectedParticipant.payment_proof_path}`}
                                            alt='Payment Proof'
                                            className='w-full max-h-96 object-contain rounded'
                                        />
                                    </div>
                                )}
                            </div>

                            <DialogFooter className='flex gap-2'>
                                <Button
                                    variant='outline'
                                    onClick={() => {
                                        setPaymentProofDialog(false);
                                        setSelectedParticipant(null);
                                    }}
                                >
                                    Close
                                </Button>
                                {selectedParticipant.status.toLowerCase() !== 'rejected' && (
                                    <Button
                                        variant='destructive'
                                        onClick={() => handleStatusChange(selectedParticipant.id, 'rejected')}
                                    >
                                        <XCircle className='h-4 w-4 mr-2' />
                                        Reject Payment
                                    </Button>
                                )}
                                {selectedParticipant.status.toLowerCase() !== 'approved' && (
                                    <Button
                                        onClick={() => handleStatusChange(selectedParticipant.id, 'approved')}
                                        className='bg-green-600 hover:bg-green-700'
                                    >
                                        <CheckCircle className='h-4 w-4 mr-2' />
                                        Approve Payment
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}