// resources/js/Pages/Manager/ManageEvents.tsx
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
import { MoreHorizontal } from 'lucide-react';

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
    user?: {
        id: number;
        name: string;
        role?: string;
    };
}

interface ManageEventsProps {
    events: Event[];
}

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
        <AppLayout>
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
                                <Button onClick={openCreateModal}>
                                    Create New Event
                                </Button>
                            </div>

                            {filteredEvents.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">No {statusFilter !== 'all' ? statusFilter : ''} events found.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Poster</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Start Date</TableHead>
                                            <TableHead>End Date</TableHead>
                                            <TableHead>Fee</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created By</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEvents.map((event) => (
                                            <TableRow key={event.id}>
                                                <TableCell>
                                                    {event.image_path ? (
                                                        <div 
                                                            className="relative h-16 w-16 cursor-pointer group"
                                                            onClick={() => setPreviewImage(`/storage/${event.image_path}`)}
                                                        >
                                                            <img
                                                                src={`/storage/${event.image_path}`}
                                                                alt={event.name || 'Event Poster'}
                                                                className="h-full w-full object-cover rounded"
                                                            />
                                                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-70 transition-all duration-300 ease-in-out rounded">
                                                                <span className="text-white font-semibold">View</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        'No Poster'
                                                    )}
                                                </TableCell>
                                                <TableCell>{event.name}</TableCell>
                                                <TableCell>{event.location}</TableCell>
                                                <TableCell>
                                                    {event.start_date ? new Date(event.start_date).toLocaleString() : 'Unknown'}
                                                </TableCell>
                                                <TableCell>
                                                    {event.end_date ? new Date(event.end_date).toLocaleString() : 'Unknown'}
                                                </TableCell>
                                                <TableCell>
                                                    {event.fee != null && !isNaN(Number(event.fee))
                                                        ? `RM${Number(event.fee).toFixed(2)}`
                                                        : 'Free'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            event.status === 'published'
                                                                ? 'default'
                                                                : event.status === 'archived'
                                                                ? 'destructive'
                                                                : 'outline'
                                                        }
                                                    >
                                                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {event.user ? (
                                                        <>
                                                            {event.user.name.charAt(0).toUpperCase() + event.user.name.slice(1)}
                                                            {event.user.role && (
                                                                <span className="ml-1">
                                                                    ({event.user.role.charAt(0).toUpperCase() + event.user.role.slice(1)})
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        'Unknown'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openEditModal(event)}>
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => router.get(`/events/${event.id}/participants`)}>
                                                                Manage Participants
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setEventToDelete(event)}>
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <EventFormModal
                isOpen={isModalOpen}
                onClose={closeModal}
                event={editingEvent}
            />

            <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the event "{eventToDelete?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Poster Preview</AlertDialogTitle>
                    </AlertDialogHeader>
                    <img src={previewImage || ''} alt="Event Poster Preview" className="w-full rounded" />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}