import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import EventFormModal from './Partials/EventFormModal';
import { type BreadcrumbItem } from "@/types";
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
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Users } from 'lucide-react';

interface Event {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    capacity?: number;
    fee?: number;
    status: 'draft' | 'published' | 'archived';
    user_id: number;
    image_path?: string;
    qr_code_path?: string;
    user?: {
        id: number;
        name: string;
        role?: string;
    };
}

interface ManageEventsProps {
    events: Event[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Manage Events', href: '/events' }];

export default function ManageEvents({ events }: ManageEventsProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');

    const openCreateModal = () => {
        setEditingEvent(null);
        setIsModalOpen(true);
    };

    const openEditModal = (event: Event) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    const handleDelete = () => {
        if (eventToDelete) {
            router.delete(`/events/${eventToDelete.id}`, {
                preserveScroll: true,
                onFinish: () => setEventToDelete(null),
            });
        }
    };

    const viewParticipants = (eventId: number) => {
        router.visit(`/events/${eventId}/participants`);
    };

    // Filter events based on selected status
    const filteredEvents = statusFilter === 'all' 
        ? events 
        : events.filter(event => event.status === statusFilter);

    // Count events by status
    const statusCounts = {
        all: events.length,
        draft: events.filter(e => e.status === 'draft').length,
        published: events.filter(e => e.status === 'published').length,
        archived: events.filter(e => e.status === 'archived').length,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Events" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-background overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-foreground">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex gap-2">
                                    <Button 
                                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                                        onClick={() => setStatusFilter('all')}
                                        size="sm"
                                    >
                                        All ({statusCounts.all})
                                    </Button>
                                    <Button 
                                        variant={statusFilter === 'draft' ? 'default' : 'outline'}
                                        onClick={() => setStatusFilter('draft')}
                                        size="sm"
                                    >
                                        Draft ({statusCounts.draft})
                                    </Button>
                                    <Button 
                                        variant={statusFilter === 'published' ? 'default' : 'outline'}
                                        onClick={() => setStatusFilter('published')}
                                        size="sm"
                                    >
                                        Published ({statusCounts.published})
                                    </Button>
                                    <Button 
                                        variant={statusFilter === 'archived' ? 'default' : 'outline'}
                                        onClick={() => setStatusFilter('archived')}
                                        size="sm"
                                    >
                                        Archived ({statusCounts.archived})
                                    </Button>
                                </div>
                                <Button onClick={openCreateModal}>Create Event</Button>
                            </div>

                            <Table>
                                <TableCaption>
                                    {filteredEvents.length === 0 
                                        ? `No ${statusFilter === 'all' ? '' : statusFilter} events found`
                                        : `A list of all your ${statusFilter === 'all' ? '' : statusFilter} events`}
                                </TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Fee</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEvents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                {statusFilter === 'all' 
                                                    ? 'No events created yet. Click "Create Event" to get started.'
                                                    : `No ${statusFilter} events found.`}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEvents.map((event) => (
                                            <TableRow key={event.id}>
                                                <TableCell className="font-medium">{event.name}</TableCell>
                                                <TableCell>{event.location}</TableCell>
                                                <TableCell>
                                                    {new Date(event.start_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            event.status === 'published'
                                                                ? 'default'
                                                                : event.status === 'draft'
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                    >
                                                        {event.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {event.fee && event.fee > 0 ? (
                                                        <span className="text-blue-600 font-semibold">
                                                            RM {Number(event.fee).toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">Free</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => viewParticipants(event.id)}
                                                        >
                                                            <Users className="h-4 w-4 mr-1" />
                                                            Participants
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openEditModal(event)}>
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => setEventToDelete(event)}
                                                                >
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Form Modal */}
            <EventFormModal
                isOpen={isModalOpen}
                onClose={closeModal}
                event={editingEvent}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the event "{eventToDelete?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}