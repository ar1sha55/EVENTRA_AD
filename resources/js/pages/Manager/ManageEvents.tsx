import React, { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import EventFormModal from './Partials/EventFormModal';
import EventViewModal from './Partials/EventViewModal';
import { type BreadcrumbItem } from "@/types";
import { toast } from 'sonner';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
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
    CheckCircle,
    Clock,
    Archive,
    FileText,
    Plus,
    ChartBar,
    Send,
    Edit3,
    RefreshCw,
    Trash2,
    X,
    AlertCircle,
} from 'lucide-react';
import { TableSkeleton, StatCardsGridSkeleton } from '@/components/ui/loading-skeletons';

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
    const page = usePage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [viewEvent, setViewEvent] = useState<Event | null>(null);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'upcoming' | 'past' | 'draft' | 'archived'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPageLoading, setIsPageLoading] = useState(false);

    // Helper function to check if event is past
    const isPastEvent = (event: Event) => {
        return new Date(event.end_date) < new Date();
    };

    // Default sort: Start Date, Descending (Newest first)
    const [sortField, setSortField] = useState<SortField>('start_date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Telegram blast dialog state
    const [showBlastDialog, setShowBlastDialog] = useState(false);
    const [publishedEventId, setPublishedEventId] = useState<number | null>(null);

    // Bulk actions state
    const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);

    // Track page loading state for skeleton display during navigation
    useEffect(() => {
        const handleStart = () => setIsPageLoading(true);
        const handleFinish = () => setIsPageLoading(false);

        router.on('start', handleStart);
        router.on('finish', handleFinish);

        return () => {
            router.on('start', handleStart);
            router.on('finish', handleFinish);
        };
    }, []);

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

    // Handle flash messages and prompt for Telegram blast
    useEffect(() => {
        const flash = page.props.flash as any;

        // Show success toast
        if (flash?.success) {
            toast.success(flash.success);
        }

        // Show blast dialog if event was published
        if (flash?.prompt_blast && flash?.event_id) {
            setPublishedEventId(flash.event_id);
            setShowBlastDialog(true);

            // Trigger notification refresh
            window.dispatchEvent(new CustomEvent('notification-created'));
        }
    }, [page.props.flash]);

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
        router.put(`/events/${event.id}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
            preserveUrl: true,
        });
    };

    const viewParticipants = (eventId: number) => {
        router.visit(`/events/${eventId}/participants`);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Bulk action handlers
    const toggleSelectAll = () => {
        if (selectedEventIds.length === paginatedEvents.length) {
            setSelectedEventIds([]);
        } else {
            setSelectedEventIds(paginatedEvents.map(e => e.id));
        }
    };

    const toggleSelectEvent = (eventId: number) => {
        setSelectedEventIds(prev =>
            prev.includes(eventId)
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId]
        );
    };

    const handleBulkStatusChange = (newStatus: 'draft' | 'published' | 'archived') => {
        if (selectedEventIds.length === 0) return;

        router.put('/events/bulk/status', {
            event_ids: selectedEventIds,
            status: newStatus,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedEventIds([]);
                toast.success(`${selectedEventIds.length} event(s) updated to ${newStatus}`);
            },
        });
    };

    const handleBulkDelete = () => {
        if (selectedEventIds.length === 0) return;

        if (confirm(`Are you sure you want to delete ${selectedEventIds.length} event(s)? This action cannot be undone.`)) {
            router.delete('/events/bulk/delete', {
                data: { event_ids: selectedEventIds },
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedEventIds([]);
                    toast.success(`${selectedEventIds.length} event(s) deleted`);
                },
            });
        }
    };

    // Calculate statistics
    const statistics = useMemo(() => {
        const now = new Date();
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

        // Count upcoming events (end_date >= now and not archived)
        const upcomingEvents = events.filter(e =>
            new Date(e.end_date) >= now && e.status !== 'archived'
        ).length;

        // Count past events (end_date < now and not archived)
        const pastEvents = events.filter(e =>
            new Date(e.end_date) < now && e.status !== 'archived'
        ).length;

        return {
            total: totalEvents,
            draft: events.filter(e => e.status === 'draft').length,
            published: events.filter(e => e.status === 'published').length,
            archived: events.filter(e => e.status === 'archived').length,
            upcoming: upcomingEvents,
            past: pastEvents,
            revenue: totalRevenue,
            participants: totalParticipants,
        };
    }, [events]);

    // Filter and sort events
    const filteredAndSortedEvents = useMemo(() => {
        // CRITICAL FIX: Create a shallow copy of the array before sorting
        let filtered = [...events];
        const now = new Date();

        // Apply status filter
        if (statusFilter === 'published') {
            filtered = filtered.filter(event => event.status === 'published');
        } else if (statusFilter === 'upcoming') {
            filtered = filtered.filter(event => new Date(event.end_date) >= now && event.status !== 'archived');
        } else if (statusFilter === 'past') {
            filtered = filtered.filter(event => new Date(event.end_date) < now && event.status !== 'archived');
        } else if (statusFilter === 'draft') {
            filtered = filtered.filter(event => event.status === 'draft');
        } else if (statusFilter === 'archived') {
            filtered = filtered.filter(event => event.status === 'archived');
        }
        // 'all' shows everything, no filter needed

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

    // Pagination using the usePagination hook
    const {
        paginatedData: paginatedEvents,
        currentPage,
        totalPages,
        itemsPerPage,
        setPage,
        setItemsPerPage,
        resetPage,
        showingFrom,
        showingTo,
        totalItems,
    } = usePagination({ data: filteredAndSortedEvents, initialItemsPerPage: 25 });

    // Reset to page 1 when filters change
    useEffect(() => {
        resetPage();
    }, [searchQuery, statusFilter, sortField, sortDirection, resetPage]);

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
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Calendar className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Manage Events</h1>
                                <p className="text-muted-foreground">Create and manage your volunteering events</p>
                            </div>
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
                        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                                        <p className="text-2xl font-bold">{statistics.total}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {statistics.upcoming} upcoming
                                        </p>
                                    </div>
                                    <Calendar className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                                        <p className="text-2xl font-bold">{statistics.participants}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Approved members
                                        </p>
                                    </div>
                                    <Users className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                                        <p className="text-2xl font-bold">RM {statistics.revenue.toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            From paid events
                                        </p>
                                    </div>
                                    <DollarSign className="h-8 w-8 text-yellow-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Published</p>
                                        <p className="text-2xl font-bold">{statistics.published}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {statistics.draft} drafts, {statistics.archived} archived
                                        </p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-purple-500" />
                                </div>
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
                                        <Calendar className="h-3 w-3 mr-1" />
                                        All ({statistics.total})
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
                                        variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
                                        onClick={() => setStatusFilter('upcoming')}
                                        size="sm"
                                    >
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Upcoming ({statistics.upcoming})
                                    </Button>
                                    <Button
                                        variant={statusFilter === 'past' ? 'default' : 'outline'}
                                        onClick={() => setStatusFilter('past')}
                                        size="sm"
                                    >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Past ({statistics.past})
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
                            {searchQuery && (
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                    <span className="text-sm text-muted-foreground">Active filters:</span>
                                    <Badge variant="secondary" className="gap-1">
                                        Search: "{searchQuery}"
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="ml-1 hover:text-foreground"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSearchQuery('')}
                                        className="h-6 text-xs"
                                    >
                                        Clear all
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bulk Actions Toolbar */}
                    {selectedEventIds.length > 0 && (
                        <Card className="border-primary/50 bg-primary/5">
                            <CardContent className="py-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="default" className="text-sm px-3 py-1">
                                            {selectedEventIds.length} selected
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedEventIds([])}
                                            className="h-8 gap-1"
                                        >
                                            <X className="h-3 w-3" />
                                            Clear selection
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleBulkStatusChange('published')}
                                            className="gap-1"
                                        >
                                            <CheckCircle className="h-3 w-3" />
                                            Publish
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleBulkStatusChange('draft')}
                                            className="gap-1"
                                        >
                                            <Clock className="h-3 w-3" />
                                            Set as Draft
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleBulkStatusChange('archived')}
                                            className="gap-1"
                                        >
                                            <Archive className="h-3 w-3" />
                                            Archive
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleBulkDelete}
                                            className="gap-1 text-red-600 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Events Table */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableCaption className="py-4">
                                        {paginatedEvents.length === 0 ? (
                                            <div className="py-8">
                                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                                <p className="text-muted-foreground text-lg">
                                                    {searchQuery || statusFilter !== 'all'
                                                        ? 'No events match your filters'
                                                        : 'No events created yet'}
                                                </p>
                                                {!searchQuery && (statusFilter === 'all' || statusFilter === 'upcoming') && paginatedEvents.length === 0 && events.length === 0 && (
                                                    <Button onClick={openCreateModal} className="mt-4">
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Create Your First Event
                                                    </Button>
                                                )}
                                            </div>
                                        ) : null}
                                    </TableCaption>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={selectedEventIds.length === paginatedEvents.length && paginatedEvents.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                    aria-label="Select all events"
                                                />
                                            </TableHead>
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
                                        {paginatedEvents.map((event) => {
                                            const participantStats = getParticipantStats(event);
                                            const isEventPast = isPastEvent(event);
                                            const isUpcoming = new Date(event.start_date) > new Date();

                                            return (
                                                <TableRow key={event.id} className={isEventPast ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedEventIds.includes(event.id)}
                                                            onCheckedChange={() => toggleSelectEvent(event.id)}
                                                            aria-label={`Select ${event.name}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </TableCell>
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
                                                            {isEventPast && (
                                                                <Badge variant="default" className="mt-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                                                    Ended
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
                                                                {/* Always available - View actions */}
                                                                <DropdownMenuItem onClick={() => openViewModal(event)}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => viewParticipants(event.id)}>
                                                                    <Users className="h-4 w-4 mr-2" />
                                                                    View Participants
                                                                </DropdownMenuItem>

                                                                {/* Edit & Status changes - Only for upcoming/future events */}
                                                                {!isEventPast && (
                                                                    <>
                                                                        <DropdownMenuSeparator />

                                                                        <DropdownMenuItem onClick={() => openEditModal(event)}>
                                                                            <FileText className="h-4 w-4 mr-2" />
                                                                            Edit
                                                                        </DropdownMenuItem>

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
                                                                    </>
                                                                )}

                                                                {/* Archive & Delete - Available for all events */}
                                                                <DropdownMenuSeparator />

                                                                <DropdownMenuItem
                                                                    onClick={() => handleQuickStatusChange(event, 'archived')}
                                                                    disabled={event.status === 'archived'}
                                                                >
                                                                    <Archive className="h-4 w-4 mr-2" />
                                                                    Archive
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() => setEventToDelete(event)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
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

                            {/* Pagination controls */}
                            {filteredAndSortedEvents.length > 0 && (
                                <TablePagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    showingFrom={showingFrom}
                                    showingTo={showingTo}
                                    onPageChange={setPage}
                                    onItemsPerPageChange={setItemsPerPage}
                                />
                            )}
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
                        <AlertDialogTitle className="flex items-center gap-2">
                            {eventToDelete && isPastEvent(eventToDelete) ? (
                                <>
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    Delete Past Event?
                                </>
                            ) : (
                                'Are you sure?'
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {eventToDelete && isPastEvent(eventToDelete) ? (
                                <div className="space-y-2">
                                    <p>You are about to delete a past event: <span className="font-semibold">"{eventToDelete?.name}"</span></p>
                                    {eventToDelete?.participants && eventToDelete.participants.length > 0 && (
                                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md p-3 mt-2">
                                            <p className="text-red-700 dark:text-red-400 font-semibold text-sm">
                                                ⚠️ This event contains:
                                            </p>
                                            <ul className="text-red-600 dark:text-red-400 text-sm mt-1 space-y-1">
                                                <li>• {eventToDelete.participants.length} registered participant(s)</li>
                                                <li>• Historical event data</li>
                                                <li>• Participant records will be lost</li>
                                            </ul>
                                        </div>
                                    )}
                                    <p className="mt-2 text-muted-foreground">This action cannot be undone.</p>
                                </div>
                            ) : (
                                <div>
                                    This will permanently delete the event "{eventToDelete?.name}".
                                    {eventToDelete?.participants && eventToDelete.participants.length > 0 && (
                                        <span className="block mt-2 text-red-600 font-semibold">
                                            Warning: This event has {eventToDelete.participants.length} registered participant(s).
                                        </span>
                                    )}
                                    <p className="mt-2">This action cannot be undone.</p>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {eventToDelete && isPastEvent(eventToDelete) ? 'Yes, Delete Past Event' : 'Delete Event'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Telegram Blast Prompt Dialog */}
            <Dialog open={showBlastDialog} onOpenChange={setShowBlastDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <DialogTitle>Event Published Successfully!</DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Your event is now live and all members have been notified via in-app notifications.
                        </p>

                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm font-medium mb-1">Want more visibility?</p>
                            <p className="text-xs text-muted-foreground">
                                Promote this event on Telegram to reach even more participants!
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowBlastDialog(false)}
                        >
                            Maybe Later
                        </Button>
                        <Button
                            onClick={() => {
                                setShowBlastDialog(false);
                                router.visit(`/manager/event-blast?event=${publishedEventId}`);
                            }}
                            className="gap-2"
                        >
                            <Send className="h-4 w-4" />
                            Blast on Telegram
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}