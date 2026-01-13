import React, { useState, useMemo, useEffect } from 'react';
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
import { 
    Clock, 
    CheckCircle, 
    XCircle, 
    Users, 
    Eye, 
    ArrowLeft,
    Search,
    FileText, // Added icon
    Mail,
    Calendar,
    CreditCard
} from 'lucide-react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator'; // Added for styling
import { toast } from 'sonner';

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

interface ParticipantTableProps {
    participants: Participant[];
    showActions?: boolean;
    isPaidEvent: boolean;
    onViewPaymentProof: (participant: Participant) => void;
    onStatusChange: (participantId: number, status: 'approved' | 'rejected') => void;
}

// Move ParticipantTable component outside to prevent recreation on every render
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ParticipantTable = ({
    participants,
    showActions = true,
    isPaidEvent,
    onViewPaymentProof,
    onStatusChange
}: ParticipantTableProps) => (
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
                                        onClick={() => onViewPaymentProof(participant)}
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
                                            onClick={() => onStatusChange(participant.id, 'approved')}
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
                                            onClick={() => onStatusChange(participant.id, 'rejected')}
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

export default function ManageParticipants({ event, participants }: ManageParticipantsProps) {
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    
    // State for Payment Proof Dialog
    const [paymentProofDialog, setPaymentProofDialog] = useState(false);
    
    // State for View Details Dialog
    const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
    const [participantToView, setParticipantToView] = useState<Participant | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    // Check for status URL parameter and set active tab
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');

        if (status && ['all', 'pending', 'approved', 'rejected'].includes(status)) {
            setActiveTab(status as 'all' | 'pending' | 'approved' | 'rejected');
            // Clean up URL without reloading
            window.history.replaceState({}, '', `/events/${event.id}/participants`);
        }
    }, [event.id]);

    const handleStatusChange = (participantId: number, status: 'approved' | 'rejected') => {
        // Convert to uppercase to match database convention
        const statusValue = status === 'approved' ? 'APPROVED' : 'REJECTED';
        router.put(`/participants/${participantId}/status`, { status: statusValue }, {
            preserveScroll: true,
            onSuccess: () => {
                setPaymentProofDialog(false);
                setViewDetailsDialog(false); // Close details modal if open
                setSelectedParticipant(null);
                
                // Show success toast
                if (status === 'approved') {
                    toast.success('Participant approved!', {
                        description: 'The participant has been successfully approved for this event.',
                    });
                } else {
                    toast.error('Participant rejected', {
                        description: 'The participant registration has been rejected.',
                    });
                }
            },
            onError: (errors) => {
                toast.error('Action failed', {
                    description: Object.values(errors).flat().join(', ') || 'Please try again.',
                });
            },
        });
    };

    const viewPaymentProof = (participant: Participant) => {
        setSelectedParticipant(participant);
        setPaymentProofDialog(true);
    };

    const openParticipantDetails = (participant: Participant) => {
        setParticipantToView(participant);
        setViewDetailsDialog(true);
    };

    // Filter participants based on Search and Tab
    const filteredParticipants = useMemo(() => {
        let filtered = participants;

        // 1. Filter by Tab
        if (activeTab === 'pending') {
            filtered = filtered.filter(p => p.status.toLowerCase() === 'pending' || p.status.toLowerCase() === 'pending_approval');
        } else if (activeTab === 'approved') {
            filtered = filtered.filter(p => p.status.toLowerCase() === 'approved');
        } else if (activeTab === 'rejected') {
            filtered = filtered.filter(p => p.status.toLowerCase() === 'rejected');
        }

        // 2. Filter by Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p => 
                p.user.name.toLowerCase().includes(query) || 
                p.user.email.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [participants, activeTab, searchQuery]);

    // Calculate stats for the cards (based on ALL participants, not filtered)
    const stats = useMemo(() => ({
        total: participants.length,
        pending: participants.filter(p => p.status.toLowerCase() === 'pending' || p.status.toLowerCase() === 'pending_approval').length,
        approved: participants.filter(p => p.status.toLowerCase() === 'approved').length,
        rejected: participants.filter(p => p.status.toLowerCase() === 'rejected').length,
    }), [participants]);

    const isPaidEvent = event.fee && event.fee > 0;

    // Helper for consistent badge styling
    const getStatusBadge = (status: string) => {
        const normalizedStatus = status.toLowerCase();
        switch (normalizedStatus) {
            case 'approved':
                return (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white border-transparent">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                    </Badge>
                );
            case 'pending':
            case 'pending_approval':
                return (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-red-600 hover:bg-red-700 text-white border-transparent">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <AppLayout>
            <Head title={`Manage Participants - ${event.name}`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Navigation & Header */}
                    <div className="flex flex-col gap-4">
                        <Button 
                            variant="ghost" 
                            className="w-fit pl-0 hover:bg-transparent hover:text-primary"
                            onClick={() => router.get('/events')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Events
                        </Button>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight">{event.name}</h2>
                                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                                    <span className="font-medium text-foreground">Date:</span> {new Date(event.start_date).toLocaleDateString()} 
                                    <span className="mx-1">•</span>
                                    <span className="font-medium text-foreground">Location:</span> {event.location}
                                </p>
                            </div>
                            {isPaidEvent && (
                                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold border border-blue-100">
                                    Fee: RM {Number(event.fee).toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className={`border-l-4 border-l-blue-500 hover:shadow-md transition-shadow ${activeTab === 'all' ? 'ring-1 ring-blue-500' : ''}`}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
                                        <p className="text-2xl font-bold">{stats.total}</p>
                                        {event.capacity && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Capacity: {event.capacity}
                                            </p>
                                        )}
                                    </div>
                                    <Users className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`border-l-4 border-l-amber-500 hover:shadow-md transition-shadow ${activeTab === 'pending' ? 'ring-1 ring-amber-500' : ''}`}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Pending</p>
                                        <p className="text-2xl font-bold">{stats.pending}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Needs review</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-amber-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`border-l-4 border-l-green-500 hover:shadow-md transition-shadow ${activeTab === 'approved' ? 'ring-1 ring-green-500' : ''}`}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Approved</p>
                                        <p className="text-2xl font-bold">{stats.approved}</p>
                                        {event.capacity ? (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {event.capacity - stats.approved} slots left
                                            </p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Confirmed participants
                                            </p>
                                        )}
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`border-l-4 border-l-red-500 hover:shadow-md transition-shadow ${activeTab === 'rejected' ? 'ring-1 ring-red-500' : ''}`}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                                        <p className="text-2xl font-bold">{stats.rejected}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Not approved
                                        </p>
                                    </div>
                                    <XCircle className="h-8 w-8 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <CardTitle>Participants List</CardTitle>
                                    <CardDescription className="mt-1">
                                        Manage registrations and verify payments
                                    </CardDescription>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Tabs */}
                            <div className="flex space-x-1 rounded-xl bg-muted p-1 mb-6 w-fit">
                                {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`
                                            w-24 rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2
                                            ${activeTab === tab
                                                ? 'bg-background text-foreground shadow'
                                                : 'text-muted-foreground hover:bg-white/[0.12] hover:text-foreground'
                                            }
                                        `}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Table */}
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            {isPaidEvent && <TableHead>Payment</TableHead>}
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredParticipants.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={isPaidEvent ? 6 : 5} className="h-32 text-center">
                                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                        <Users className="h-8 w-8 mb-2 opacity-50" />
                                                        <p>No participants found in this category.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredParticipants.map((participant) => (
                                                <TableRow key={participant.id}>
                                                    <TableCell className="font-medium">{participant.user.name}</TableCell>
                                                    <TableCell>{participant.user.email}</TableCell>
                                                    <TableCell>
                                                        {new Date(participant.registration_date).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(participant.status)}
                                                    </TableCell>
                                                    {isPaidEvent && (
                                                        <TableCell>
                                                            {participant.payment_proof_path ? (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8"
                                                                    onClick={() => viewPaymentProof(participant)}
                                                                >
                                                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                                    View Proof
                                                                </Button>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic">Not provided</span>
                                                            )}
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            
                                                            {/* View Details Button - ADDED */}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openParticipantDetails(participant)}
                                                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                                                title="View Details"
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                            </Button>

                                                            {/* Approve Button - Show only if NOT approved */}
                                                            {participant.status.toLowerCase() !== 'approved' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleStatusChange(participant.id, 'approved')}
                                                                    className="h-8 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-1.5" />
                                                                    Approve
                                                                </Button>
                                                            )}
                                                            
                                                            {/* Reject Button - Show only if NOT rejected */}
                                                            {participant.status.toLowerCase() !== 'rejected' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleStatusChange(participant.id, 'rejected')}
                                                                    className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-1.5" />
                                                                    Reject
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Payment Proof Dialog */}
            <Dialog open={paymentProofDialog} onOpenChange={setPaymentProofDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>Verify Payment Proof</DialogTitle>
                        <DialogDescription>
                            Please review the payment proof before approving the registration.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedParticipant && (
                        <>
                            <div className="flex-1 overflow-y-auto px-1">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Participant</p>
                                            <p className="font-medium">{selectedParticipant.user.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Email</p>
                                            <p className="font-medium">{selectedParticipant.user.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Amount Due</p>
                                            <p className="font-medium text-blue-600">RM {Number(event.fee).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Submitted On</p>
                                            <p className="font-medium">{new Date(selectedParticipant.registration_date).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="border rounded-lg p-2 bg-muted/30 flex items-center justify-center">
                                        {selectedParticipant.payment_proof_path ? (
                                            <img
                                                src={`/storage/${selectedParticipant.payment_proof_path}`}
                                                alt="Payment Proof"
                                                className="max-w-full h-auto object-contain rounded"
                                            />
                                        ) : (
                                            <p className="text-muted-foreground py-8">No image available</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="flex-shrink-0 mt-4">
                                <Button variant="outline" onClick={() => setPaymentProofDialog(false)} className="w-full sm:w-auto">
                                    Close
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* NEW: Participant Details Dialog */}
            <Dialog open={viewDetailsDialog} onOpenChange={setViewDetailsDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Participant Details</DialogTitle>
                        <DialogDescription>
                            Detailed information about the participant.
                        </DialogDescription>
                    </DialogHeader>

                    {participantToView && (
                        <div className="space-y-6 py-4">
                            
                            {/* Header Section */}
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                                    {participantToView.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{participantToView.user.name}</h3>
                                    <div className="mt-1">
                                        {getStatusBadge(participantToView.status)}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Details Grid */}
                            <div className="grid gap-4">
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-4 w-4" /> Email
                                    </div>
                                    <div className="col-span-2 text-sm font-medium">
                                        {participantToView.user.email}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Joined
                                    </div>
                                    <div className="col-span-2 text-sm font-medium">
                                        {new Date(participantToView.registration_date).toLocaleString()}
                                    </div>
                                </div>
                                {isPaidEvent && (
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" /> Payment
                                        </div>
                                        <div className="col-span-2 text-sm font-medium">
                                            {participantToView.payment_proof_path ? (
                                                <span className="text-green-600 flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" /> Proof Uploaded
                                                </span>
                                            ) : (
                                                <span className="text-red-500">Pending Upload</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Proof Preview in Details (if exists) */}
                            {isPaidEvent && participantToView.payment_proof_path && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium mb-2">Payment Proof</h4>
                                    <div className="border rounded-md overflow-hidden bg-muted/20">
                                        <img 
                                            src={`/storage/${participantToView.payment_proof_path}`} 
                                            alt="Payment Proof" 
                                            className="w-full h-48 object-contain bg-black/5"
                                            onClick={() => {
                                                // Optional: Open the dedicated proof dialog for better view
                                                setViewDetailsDialog(false);
                                                viewPaymentProof(participantToView);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="outline" onClick={() => setViewDetailsDialog(false)}>
                                    Close
                                </Button>
                                {/* Allow quick actions from details view */}
                                {participantToView.status.toLowerCase() !== 'approved' && (
                                    <Button 
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleStatusChange(participantToView.id, 'approved')}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve Participant
                                    </Button>
                                )}
                                {participantToView.status.toLowerCase() !== 'rejected' && (
                                    <Button 
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => handleStatusChange(participantToView.id, 'rejected')}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject Participant
                                    </Button>
                                )}
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}