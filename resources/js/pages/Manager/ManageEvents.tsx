import React, { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import EventFormModal from './Partials/EventFormModal';
import EventViewModal from './Partials/EventViewModal';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    MoreHorizontal,
    Users,
    Search,
    ArrowUpDown, // Default icon
    ArrowUp,     // Added for Ascending
    ArrowDown,   // Added for Descending
    Calendar,
    DollarSign,
    Eye,
    EyeOff,
    CheckCircle,
    Clock,
    Archive,
    FileText,
    Plus,
    ChartBar,
    Image,
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
    fee?: number;
    status: 'draft' | 'published' | 'archived';
    user_id: number;
    image_path?: string;
    qr_code_path?: string;
    is_gallery_visible?: boolean;
    participants?: Participant[];
    user?: {
        id: number;
        name: string;
        role?: string;
    };
}

interface ManageEventsProps {
    events: Event[];
}

type SortField = 'name' | 'start_date' | 'end_date' | 'location' | 'fee';
type SortDirection = 'asc' | 'desc';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Manage Events', href: '/events' }];

// SortButton component declared outside to prevent recreation on each render
interface SortButtonProps {
    field: SortField;
    children: React.ReactNode;
    sortField: SortField;
    sortDirection: SortDirection;
    onSort: (field: SortField) => void;
}

const SortButton = ({ field, children, sortField, sortDirection, onSort }: SortButtonProps) => {
    const isActive = sortField === field;

    return (
        <button
            onClick={() => onSort(field)}
            className={`flex items-center gap-1 transition-colors hover:text-foreground ${
                isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
            }`}
            title={isActive ? `Sorted ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}` : 'Click to sort'}
        >
            {children}
            <span className="flex flex-col justify-center h-4 w-4">
                {isActive ? (
                    sortDirection === 'asc' ? (
                        <ArrowUp className="h-3 w-3 text-primary" />
                    ) : (
                        <ArrowDown className="h-3 w-3 text-primary" />
                    )
                ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                )}
            </span>
        </button>
    );
};

export default function ManageEvents({ events }: ManageEventsProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [viewEvent, setViewEvent] = useState<Event | null>(null);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Default sort: Start Date, Descending (Newest first)
    const [sortField, setSortField] = useState<SortField>('start_date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Handle opening view modal from notification
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const viewEventId = urlParams.get('view_event_id');

        if (viewEventId) {
            const event = events.find(e => e.id === parseInt(viewEventId));
            if (event) {
                setViewEvent(event);
                // Clean up URL
                window.history.replaceState({}, '', '/events');
            }
        }
    }, [events]);

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

    const openViewModal = (event: Event) => {
        setViewEvent(event);
    };

    const closeViewModal = () => {
        setViewEvent(null);
    };

    const handleDelete = () => {
        if (eventToDelete) {
            router.delete(`/events/${eventToDelete.id}`, {
                preserveScroll: true,
                onFinish: () => setEventToDelete(null),
            });
        }
    };

    const handleQuickStatusChange = (event: Event, newStatus: 'draft' | 'published' | 'archived') => {
        router.put(`/events/${event.id}`, {
            ...event,
            status: newStatus,
        } as any, { 
            preserveScroll: true,
        });
    };

    const viewParticipants = (eventId: number) => {
        router.visit(`/events/${eventId}/participants`);
    };

    const handleToggleGalleryVisibility = (event: Event) => {
        router.post(`/events/${event.id}/toggle-gallery-visibility`, {}, {
            preserveScroll: true,
        });
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Calculate statistics
    const statistics = useMemo(() => {
        const totalEvents = events.length;
        const totalRevenue = events.reduce((sum, event) => {
            if (event.fee && event.fee > 0 && event.participants) {
                const approvedParticipants = event.participants.filter(p => p.status === 'approved').length;
                return sum + (event.fee * approvedParticipants);
            }
            return sum;
        }, 0);

        const totalParticipants = events.reduce((sum, event) => {
            // FIXED: Only count approved participants
            // Previous code counted 'pending_approval' too.
            const count = event.participants?.filter(p => p.status === 'approved').length || 0;
            return sum + count;
        }, 0);

        const upcomingEvents = events.filter(e =>
            e.status === 'published' && new Date(e.start_date) > new Date()
        ).length;

        return {
            total: totalEvents,
            draft: events.filter(e => e.status === 'draft').length,
            published: events.filter(e => e.status === 'published').length,
            archived: events.filter(e => e.status === 'archived').length,
            revenue: totalRevenue,
            participants: totalParticipants,
            upcoming: upcomingEvents,
        };
    }, [events]);

    // Filter and sort events
    const filteredAndSortedEvents = useMemo(() => {
        // CRITICAL FIX: Create a shallow copy of the array before sorting
        let filtered = [...events];

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(event => event.status === statusFilter);
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(event =>
                event.name.toLowerCase().includes(query) ||
                event.location.toLowerCase().includes(query) ||
                event.description.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];

            // FIX: Handle nulls/undefined FIRST to prevent "cannot read property of null" crash
            if (aValue === null || aValue === undefined) aValue = 0;
            if (bValue === null || bValue === undefined) bValue = 0;

            // Handle dates
            if (sortField === 'start_date' || sortField === 'end_date') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }
            // Handle Fee specifically (Force numeric sort)
            else if (sortField === 'fee') {
                aValue = Number(aValue);
                bValue = Number(bValue);
            }
            // Handle generic strings
            else if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [events, statusFilter, searchQuery, sortField, sortDirection]);

    const getParticipantStats = (event: Event) => {
        if (!event.participants) return { approved: 0, pending: 0, total: 0 };
        const approved = event.participants.filter(p => p.status === 'approved').length;
        const pending = event.participants.filter(p => p.status === 'pending_approval').length;
        // Note: We keep 'total' here as approved + pending because for capacity limits (slots taken), 
        // pending users DO take up a slot until they are rejected.
        return { approved, pending, total: approved + pending };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Events" />

            <div className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header with Create Button */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Manage Events</h1>
                            <p className="text-muted-foreground mt-1">Create and manage your volunteering events</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => router.visit('/manager/manage-analytics')}
                                size="lg"
                                variant="outline"
                            >
                                <ChartBar className="h-4 w-4 mr-2" />
                                Past Events Analytics
                            </Button>
                            <Button onClick={openCreateModal} size="lg">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Event
                            </Button>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.total}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {statistics.upcoming} upcoming
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.participants}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Approved members
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">RM {statistics.revenue.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    From paid events
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Published</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.published}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {statistics.draft} drafts, {statistics.archived} archived
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters and Search */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search events by name, location, or description..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Status Filter Buttons */}
                                <div className="flex gap-2 flex-wrap">
                                    <Button
                                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                                        onClick={() => setStatusFilter('all')}
                                        size="sm"
                                    >
                                        All ({statistics.total})
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'draft' ? 'default' : 'outline'}
                                        onClick={() => setStatusFilter('draft')}
                                        size="sm"
                                    >
                                        <Clock className="h-3 w-3 mr-1" />
                                        Draft ({statistics.draft})
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'published' ? 'default' : 'outline'}
                                        onClick={() => setStatusFilter('published')}
                                        size="sm"
                                    >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Published ({statistics.published})
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'archived' ? 'default' : 'outline'}
                                        onClick={() => setStatusFilter('archived')}
                                        size="sm"
                                    >
                                        <Archive className="h-3 w-3 mr-1" />
                                        Archived ({statistics.archived})
                                    </Button>
                                </div>
                            </div>

                            {/* Active Filters Display */}
                            {(searchQuery || statusFilter !== 'all') && (
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                    <span className="text-sm text-muted-foreground">Active filters:</span>
                                    {searchQuery && (
                                        <Badge variant="secondary" className="gap-1">
                                            Search: "{searchQuery}"
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="ml-1 hover:text-foreground"
                                            >
                                                ×
                                            </button>
                                        </Badge>
                                    )}
                                    {statusFilter !== 'all' && (
                                        <Badge variant="secondary" className="gap-1">
                                            Status: {statusFilter}
                                            <button
                                                onClick={() => setStatusFilter('all')}
                                                className="ml-1 hover:text-foreground"
                                            >
                                                ×
                                            </button>
                                        </Badge>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setStatusFilter('all');
                                        }}
                                        className="h-6 text-xs"
                                    >
                                        Clear all
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Events Table */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableCaption className="py-4">
                                        {filteredAndSortedEvents.length === 0 ? (
                                            <div className="py-8">
                                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                                <p className="text-muted-foreground text-lg">
                                                    {searchQuery || statusFilter !== 'all'
                                                        ? 'No events match your filters'
                                                        : 'No events created yet'}
                                                </p>
                                                {!searchQuery && statusFilter === 'all' && (
                                                    <Button onClick={openCreateModal} className="mt-4">
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Create Your First Event
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            `Showing ${filteredAndSortedEvents.length} of ${statistics.total} events`
                                        )}
                                    </TableCaption>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Poster</TableHead>
                                            <TableHead>
                                                <SortButton field="name" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                                                    Name
                                                </SortButton>
                                            </TableHead>
                                            <TableHead>
                                                <SortButton field="location" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                                                    Location
                                                </SortButton>
                                            </TableHead>
                                            <TableHead>
                                                <SortButton field="start_date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                                                    Start Date
                                                </SortButton>
                                            </TableHead>
                                            <TableHead>
                                                <SortButton field="end_date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                                                    End Date
                                                </SortButton>
                                            </TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>
                                                <SortButton field="fee" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                                                    Fee
                                                </SortButton>
                                            </TableHead>
                                            <TableHead>Participants</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAndSortedEvents.map((event) => {
                                            const participantStats = getParticipantStats(event);
                                            const isPastEvent = new Date(event.end_date) < new Date();
                                            const isUpcoming = new Date(event.start_date) > new Date();

                                            return (
                                                <TableRow key={event.id} className={isPastEvent ? 'opacity-60' : ''}>
                                                    <TableCell>
                                                        {event.image_path ? (
                                                            <div
                                                                className="relative w-16 h-16 rounded-md overflow-hidden border cursor-pointer group"
                                                                onClick={() => openViewModal(event)}
                                                            >
                                                                <img
                                                                    src={`/storage/${event.image_path}`}
                                                                    alt={event.name}
                                                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                                />
                                                                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity duration-200">
                                                                    <Eye className="h-4 w-4" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-md border bg-muted flex items-center justify-center">
                                                                <Calendar className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{event.name}</p>
                                                            {isUpcoming && event.status === 'published' && (
                                                                <Badge variant="outline" className="mt-1 text-xs">
                                                                    Upcoming
                                                                </Badge>
                                                            )}
                                                            {isPastEvent && (
                                                                <Badge variant="secondary" className="mt-1 text-xs">
                                                                    Past Event
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-sm">{event.location}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-sm">
                                                            {new Date(event.start_date.replace(' ', 'T')).toLocaleString("en-MY", {
                                                                dateStyle: "medium",
                                                                timeStyle: "short",
                                                                timeZone: "Asia/Kuala_Lumpur",
                                                            })}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-sm">
                                                            {new Date(event.end_date.replace(' ', 'T')).toLocaleString("en-MY", {
                                                                dateStyle: "medium",
                                                                timeStyle: "short",
                                                                timeZone: "Asia/Kuala_Lumpur",
                                                            })}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                event.status === "published"
                                                                    ? "default"
                                                                    : event.status === "draft"
                                                                        ? "secondary"
                                                                        : "outline"
                                                            }
                                                        >
                                                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {event.fee && event.fee > 0 ? (
                                                            <div>
                                                                <p className="text-green-600 font-semibold">
                                                                    RM {Number(event.fee).toFixed(2)}
                                                                </p>
                                                                {participantStats.approved > 0 && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Revenue: RM {(event.fee * participantStats.approved).toFixed(2)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">Free</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => viewParticipants(event.id)}
                                                                className="w-full justify-start"
                                                            >
                                                                <Users className="h-3 w-3 mr-1" />
                                                                {participantStats.total}
                                                                {event.capacity ? ` / ${event.capacity}` : ''}
                                                            </Button>
                                                            {participantStats.pending > 0 && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {participantStats.pending} pending
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openViewModal(event)}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => openEditModal(event)}>
                                                                    <FileText className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => viewParticipants(event.id)}>
                                                                    <Users className="h-4 w-4 mr-2" />
                                                                    View Participants
                                                                </DropdownMenuItem>

                                                                <DropdownMenuSeparator />

                                                                <DropdownMenuItem
                                                                    onClick={() => handleQuickStatusChange(event, 'draft')}
                                                                    disabled={event.status === 'draft'}
                                                                >
                                                                    <Clock className="h-4 w-4 mr-2" />
                                                                    Set as Draft
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleQuickStatusChange(event, 'published')}
                                                                    disabled={event.status === 'published'}
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                    Publish
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleQuickStatusChange(event, 'archived')}
                                                                    disabled={event.status === 'archived'}
                                                                >
                                                                    <Archive className="h-4 w-4 mr-2" />
                                                                    Archive
                                                                </DropdownMenuItem>

                                                                {isPastEvent && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleToggleGalleryVisibility(event)}
                                                                        >
                                                                            {event.is_gallery_visible ? (
                                                                                <>
                                                                                    <EyeOff className="h-4 w-4 mr-2" />
                                                                                    Hide from Gallery
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Image className="h-4 w-4 mr-2" />
                                                                                    Show in Gallery
                                                                                </>
                                                                            )}
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}

                                                                <DropdownMenuSeparator />

                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() => setEventToDelete(event)}
                                                                >
                                                                    Delete Event
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Event Form Modal */}
            <EventFormModal
                isOpen={isModalOpen}
                onClose={closeModal}
                event={editingEvent}
            />

            {/* Event View Modal */}
            <EventViewModal
                isOpen={!!viewEvent}
                onClose={closeViewModal}
                event={viewEvent}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the event "{eventToDelete?.name}".
                            {eventToDelete?.participants && eventToDelete.participants.length > 0 && (
                                <span className="block mt-2 text-red-600 font-semibold">
                                    Warning: This event has {eventToDelete.participants.length} registered participant(s).
                                </span>
                            )}
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete Event
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}