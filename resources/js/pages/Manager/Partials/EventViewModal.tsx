import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Calendar,
    MapPin,
    Users,
    DollarSign,
    Image as ImageIcon,
    QrCode,
    Download,
    ExternalLink,
    Clock,
    FileText,
} from 'lucide-react';

interface Participant {
    id: number;
    status: string;
}

interface Event {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    capacity?: number;
    fee?: number | string | null;
    status: 'draft' | 'published' | 'archived';
    image_path?: string;
    qr_code_path?: string;
    participants?: Participant[];
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
}

export default function EventViewModal({ isOpen, onClose, event }: ModalProps) {
    const [posterPreviewOpen, setPosterPreviewOpen] = useState(false);
    const [qrPreviewOpen, setQrPreviewOpen] = useState(false);

    if (!event) return null;

    const participantStats = event.participants ? {
        approved: event.participants.filter(p => p.status.toLowerCase() === 'approved').length,
        pending: event.participants.filter(p => p.status.toLowerCase() === 'pending' || p.status.toLowerCase() === 'pending_approval').length,
        rejected: event.participants.filter(p => p.status.toLowerCase() === 'rejected').length,
        total: event.participants.length,
    } : { approved: 0, pending: 0, rejected: 0, total: 0 };

    const revenue = (event.fee && Number(event.fee) > 0)
        ? Number(event.fee) * participantStats.approved
        : 0;

    const isPastEvent = new Date(event.end_date) < new Date();
    const isUpcoming = new Date(event.start_date) > new Date();
    const isOngoing = new Date(event.start_date) <= new Date() && new Date() <= new Date(event.end_date);

    const downloadQRCode = () => {
        if (!event.qr_code_path) return;
        const link = document.createElement('a');
        link.href = `/storage/${event.qr_code_path}`;
        link.download = `${event.name}-QR-Code.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'archived':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <DialogTitle className="text-2xl">{event.name}</DialogTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge className={getStatusColor(event.status)}>
                                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                    </Badge>
                                    {isUpcoming && event.status === 'published' && (
                                        <Badge variant="outline">Upcoming</Badge>
                                    )}
                                    {isOngoing && (
                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">Ongoing</Badge>
                                    )}
                                    {isPastEvent && (
                                        <Badge variant="secondary">Past Event</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Event Poster */}
                    {event.image_path && (
                        <div className="relative group">
                            <img
                                src={`/storage/${event.image_path}`}
                                alt={event.name}
                                className="w-full h-80 object-cover rounded-lg border cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                                onClick={() => setPosterPreviewOpen(true)}
                            />
                            <div className="absolute inset-0 bg-transparent rounded-lg flex items-center justify-center transition-all duration-200 group-hover:bg-black/20">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setPosterPreviewOpen(true)}
                                    >
                                        <ImageIcon className="h-4 w-4 mr-2" />
                                        View Full Size
                                    </Button>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Users className="h-4 w-4" />
                                <span className="text-xs font-medium">Participants</span>
                            </div>
                            <p className="text-2xl font-bold">
                                {participantStats.approved + participantStats.pending}
                                {event.capacity ? ` / ${event.capacity}` : ''}
                            </p>
                            {participantStats.pending > 0 && (
                                <p className="text-xs text-yellow-600 mt-1">
                                    {participantStats.pending} pending
                                </p>
                            )}
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <DollarSign className="h-4 w-4" />
                                <span className="text-xs font-medium">Fee</span>
                            </div>
                            <p className="text-2xl font-bold">
                                {event.fee && Number(event.fee) > 0
                                    ? `RM ${Number(event.fee).toFixed(2)}`
                                    : 'Free'}
                            </p>
                            {revenue > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                    Revenue: RM {revenue.toFixed(2)}
                                </p>
                            )}
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs font-medium">Duration</span>
                            </div>
                            <p className="text-2xl font-bold">
                                {(() => {
                                    const days = Math.ceil((new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) / (1000 * 60 * 60 * 24));
                                    return `${days} ${days === 1 ? 'day' : 'days'}`;
                                })()}
                            </p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs font-medium">Status</span>
                            </div>
                            <p className="text-2xl font-bold">
                                {isUpcoming ? 'Not Started' : isOngoing ? 'In Progress' : 'Completed'}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Event Details */}
                    <div className="space-y-6">
                        {/* Description */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <Label className="text-base font-semibold">Description</Label>
                            </div>
                            <p className="text-muted-foreground whitespace-pre-line leading-relaxed pl-6">
                                {event.description}
                            </p>
                        </div>

                        <Separator />

                        {/* Date and Time */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <Label className="font-semibold">Start Date & Time</Label>
                                </div>
                                <p className="text-muted-foreground pl-6">
                                    {new Date(event.start_date).toLocaleString("en-MY", {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <Label className="font-semibold">End Date & Time</Label>
                                </div>
                                <p className="text-muted-foreground pl-6">
                                    {new Date(event.end_date).toLocaleString("en-MY", {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Location */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <Label className="font-semibold">Location</Label>
                            </div>
                            <p className="text-muted-foreground pl-6">{event.location}</p>
                        </div>

                        {/* Capacity */}
                        {event.capacity !== undefined && event.capacity > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <Label className="font-semibold">Capacity</Label>
                                    </div>
                                    <div className="pl-6">
                                        <p className="text-muted-foreground">
                                            {event.capacity} participants maximum
                                        </p>
                                        <div className="mt-2 w-full bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary rounded-full h-2 transition-all duration-300"
                                                style={{
                                                    width: `${Math.min((participantStats.approved + participantStats.pending) / event.capacity * 100, 100)}%`
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {event.capacity - (participantStats.approved + participantStats.pending)} slots remaining
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* QR Code for Paid Events */}
                        {event.qr_code_path && event.fee && Number(event.fee) > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <QrCode className="h-4 w-4 text-muted-foreground" />
                                            <Label className="font-semibold">Payment QR Code</Label>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={downloadQRCode}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                    <div className="pl-6">
                                        <div className="bg-muted/50 rounded-lg p-4 inline-block">
                                            <img
                                                src={`/storage/${event.qr_code_path}`}
                                                alt={`${event.name} QR Code`}
                                                className="w-48 h-48 object-contain cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => setQrPreviewOpen(true)}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Participants will scan this QR code to make payment
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Participant Statistics */}
                        {participantStats.total > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <Label className="font-semibold">Registration Statistics</Label>
                                    </div>
                                    <div className="pl-6 grid grid-cols-3 gap-4">
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <p className="text-xs text-green-600 font-medium">Approved</p>
                                            <p className="text-2xl font-bold text-green-700">{participantStats.approved}</p>
                                        </div>
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                            <p className="text-xs text-yellow-600 font-medium">Pending</p>
                                            <p className="text-2xl font-bold text-yellow-700">{participantStats.pending}</p>
                                        </div>
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-xs text-red-600 font-medium">Rejected</p>
                                            <p className="text-2xl font-bold text-red-700">{participantStats.rejected}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                        <Button
                            onClick={() => window.open(`/events/${event.id}/participants`, '_blank')}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            View Participants
                            <ExternalLink className="h-3 w-3 ml-2" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Poster Preview Modal */}
            {event.image_path && (
                <Dialog open={posterPreviewOpen} onOpenChange={() => setPosterPreviewOpen(false)}>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Event Poster</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center justify-center">
                            <img
                                src={`/storage/${event.image_path}`}
                                alt={event.name}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPosterPreviewOpen(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* QR Code Preview Modal */}
            {event.qr_code_path && (
                <Dialog open={qrPreviewOpen} onOpenChange={() => setQrPreviewOpen(false)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Payment QR Code</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center justify-center bg-muted/50 rounded-lg p-8">
                            <img
                                src={`/storage/${event.qr_code_path}`}
                                alt={`${event.name} QR Code`}
                                className="w-full max-w-sm object-contain"
                            />
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setQrPreviewOpen(false)}>
                                Close
                            </Button>
                            <Button onClick={downloadQRCode}>
                                <Download className="h-4 w-4 mr-2" />
                                Download QR Code
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}