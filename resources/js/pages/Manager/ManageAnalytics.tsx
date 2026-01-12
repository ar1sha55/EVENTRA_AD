import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, router } from "@inertiajs/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { useState, useEffect, useMemo, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ChartBar,
  ImageIcon,
  Search,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Upload,
  X,
  Calendar,
  MapPin,
  ArrowUpRight,
  FilterX,
  AlertTriangle,
  Maximize2,
  Download,
  Star,
  Eye,
  EyeOff
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Past Events Analytics", href: "/manager/manage-analytics" },
];

// --- Interfaces ---
interface PastEvent {
  id: number;
  name: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  capacity: number;
  fee: number | null;
  status: string;
  image_path: string | null;
  participants_count: number;
  approved_participants_count: number;
  attendance_rate: number;
  total_volunteer_hours: number;
  revenue: number;
  photos_count: number;
  documents_count: number;
  has_documentation: boolean;
  is_gallery_visible: boolean;
  documentation: Documentation[];
}

interface Documentation {
  id: number;
  event_id: number;
  type: "photo" | "document" | "summary";
  file_path: string | null;
  title: string | null;
  description: string | null;
  sort_order: number;
  uploaded_by: number;
  created_at: string;
}

interface EventAnalytics {
  event: {
    id: number;
    name: string;
    description: string;
    location: string;
    start_date: string;
    end_date: string;
    capacity: number;
    fee: number | null;
    image_path: string | null;
  };
  metrics: {
    total_participants: number;
    approved_participants: number;
    pending_participants: number;
    rejected_participants: number;
    attendance_rate: number;
    total_volunteer_hours: number;
    revenue: number;
  };
  demographics: {
    faculty_breakdown: Record<string, number>;
  };
  timeline: {
    registration_timeline: Array<{ date: string; count: number }>;
  };
}

interface ParticipantFeedback {
  rating: number;
  comment: string | null;
  submitted_at: string;
}

interface EventParticipant {
  id: number;
  user_id: number;
  name: string;
  email: string;
  matric_id: string;
  faculty: string;
  faculty_code: string;
  hours_logged: number;
  registration_date: string;
  feedback: ParticipantFeedback | null;
}

interface FeedbackStats {
  total_responses: number;
  average_rating: number;
  rating_distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

// --- Utils & Helpers ---

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-xl p-3 text-sm z-50">
        <p className="font-medium mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill || payload[0].stroke }} />
          <span className="text-muted-foreground">{payload[0].name}:</span>
          <span className="font-bold">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const MetricCard = ({ title, value, icon: Icon, colorClass, bgClass, subtext }: any) => {
  // Data validation - handle null, undefined, and NaN values
  const formatValue = (val: any) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number' && isNaN(val)) return '0';
    if (typeof val === 'string' && val.trim() === '') return '—';
    return val;
  };

  return (
    <Card className={`border-none shadow-sm ${bgClass} transition-all duration-200`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-xl ${colorClass} bg-white dark:bg-black/40`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          {subtext && <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/60 dark:bg-black/20 text-muted-foreground">{subtext}</span>}
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight text-foreground">{formatValue(value)}</p>
          <p className="text-sm font-medium text-muted-foreground/80">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const ChartEmptyState = ({ message }: { message: string }) => (
    <div className="h-[250px] w-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
        <ChartBar className="h-8 w-8 mb-2 opacity-20" />
        <p className="text-sm">{message}</p>
    </div>
);

// --- Sub-Component: Analytics Content ---
const AnalyticsModalContent = memo(({
    eventAnalytics,
    selectedEvent,
    handleCloseModal,
    handleToggleGalleryVisibility,
    setUploadModalOpen,
    handleDeleteDocumentation,
    facultyData,
    participationData,
    timelineData,
    activeTab,
    onTabChange,
    onViewImage,
    participants,
    feedbackStats,
    loadingParticipants
}: any) => {

    if (!eventAnalytics || !selectedEvent) return null;

    // Engagement Metrics
    const totalRegistrations = eventAnalytics.metrics.total_participants || 0;
    const approvedCount = eventAnalytics.metrics.approved_participants || 0;
    const capacity = selectedEvent.capacity || 0;
    
    const demandPercentage = capacity > 0 ? Math.round((totalRegistrations / capacity) * 100) : 0;
    
    // Use approved count directly since the attendance rate seems to be capacity-based (fill rate)
    // rather than turnout-based (attendees/approved).
    const estimatedAttendees = approvedCount;

    const avgHours = approvedCount > 0 
        ? (eventAnalytics.metrics.total_volunteer_hours / approvedCount).toFixed(1) 
        : "0";

    const hasData = totalRegistrations > 0;

    return (
        <>
            {/* 1. Hero Section */}
            <div className="relative h-48 shrink-0 w-full bg-muted overflow-hidden group">
                {selectedEvent?.image_path ? (
                    <div className="absolute inset-0">
                        <img
                            src={`/storage/${selectedEvent.image_path}`}
                            alt="Event Banner"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    </div>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-primary/20" />
                    </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-6 pt-0">
                        <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground shadow-sm drop-shadow-md mb-2">{selectedEvent?.name}</h2>
                            <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4"/> {selectedEvent && formatDate(selectedEvent.start_date)}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {selectedEvent?.location}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="icon"
                                variant="secondary"
                                className="rounded-full h-8 w-8 bg-background/50 hover:bg-background"
                                onClick={() => handleToggleGalleryVisibility(selectedEvent)}
                                aria-label={selectedEvent?.is_gallery_visible ? "Hide from gallery" : "Show in gallery"}
                                title={selectedEvent?.is_gallery_visible ? "Hide from gallery" : "Show in gallery"}
                            >
                                {selectedEvent?.is_gallery_visible ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="rounded-full h-8 w-8 bg-background/50 hover:bg-background"
                                onClick={handleCloseModal}
                                aria-label="Close analytics modal"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        </div>
                </div>
            </div>

            {/* 2. Tabs & Content */}
            <div className="flex-1 flex flex-col min-h-0">
                <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col h-full">
                    <div className="px-6 py-2 border-b bg-background/95 shrink-0">
                        <TabsList className="grid w-full max-w-md grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="documentation">Documentation</TabsTrigger>
                            <TabsTrigger value="participants">Participants</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 pb-20 scroll-smooth print:overflow-visible">
                        <TabsContent value="overview" className="mt-0 space-y-8">
                            
                            {/* Bento Grid Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricCard 
                                    title="Participants" 
                                    value={eventAnalytics?.metrics.approved_participants || 0}
                                    icon={Users}
                                    bgClass="bg-blue-50/50 dark:bg-blue-950/20"
                                    colorClass="text-blue-600 dark:text-blue-400"
                                />
                                <MetricCard 
                                    title="Attendance Rate" 
                                    value={`${eventAnalytics?.metrics.attendance_rate || 0}%`}
                                    icon={TrendingUp}
                                    bgClass="bg-emerald-50/50 dark:bg-emerald-950/20"
                                    colorClass="text-emerald-600 dark:text-emerald-400"
                                />
                                <MetricCard 
                                    title="Total Hours" 
                                    value={eventAnalytics?.metrics.total_volunteer_hours || 0}
                                    icon={Clock}
                                    bgClass="bg-purple-50/50 dark:bg-purple-950/20"
                                    colorClass="text-purple-600 dark:text-purple-400"
                                />
                                <MetricCard 
                                    title="Revenue Generated" 
                                    value={`RM ${eventAnalytics?.metrics.revenue.toFixed(2) || "0.00"}`}
                                    icon={DollarSign}
                                    bgClass="bg-amber-50/50 dark:bg-amber-950/20"
                                    colorClass="text-amber-600 dark:text-amber-400"
                                />
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Participation Pie */}
                                <Card className="shadow-sm border-border/60">
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold">Participation Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {hasData ? (
                                            <>
                                                <div className="h-[250px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={participationData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={80}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                            >
                                                                {participationData.map((entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip content={<CustomTooltip />} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="flex justify-center gap-4 mt-2">
                                                    {participationData.map((entry: any) => (
                                                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                                                            <span className="text-muted-foreground">{entry.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : <ChartEmptyState message="No participation data recorded" />}
                                    </CardContent>
                                </Card>

                                {/* Faculty Bar Chart */}
                                <Card className="shadow-sm border-border/60">
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold">Faculty Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {hasData ? (
                                            <div className="h-[250px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={facultyData} layout="vertical" margin={{ left: 0, right: 30 }}>
                                                        <XAxis type="number" hide />
                                                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: 'currentColor'}} interval={0} />
                                                        <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                                                        <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : <ChartEmptyState message="No faculty data available" />}
                                    </CardContent>
                                </Card>
                                
                                {/* Timeline */}
                                {timelineData.length > 0 && (
                                    <Card className="md:col-span-2 shadow-sm border-border/60">
                                        <CardHeader>
                                            <CardTitle className="text-base font-semibold">Participant Growth Trend</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-[300px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={timelineData}>
                                                        <defs>
                                                            <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'currentColor'}} dy={10} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'currentColor'}} />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Area type="monotone" dataKey="registrations" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorReg)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                            
                            {/* Description Text */}
                            <Card className="bg-muted/30 border-none">
                                <CardContent className="p-6">
                                    <h4 className="font-semibold mb-2">About this Event</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {selectedEvent?.description}
                                    </p>
                                </CardContent>
                            </Card>

                        </TabsContent>

                        <TabsContent value="documentation" className="mt-0 space-y-6">
                            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                                <div>
                                    <h3 className="font-medium">Documentation Hub</h3>
                                    <p className="text-sm text-muted-foreground">Manage photos, documents, and post-event summaries.</p>
                                </div>
                                <Button
                                    onClick={() => setUploadModalOpen(true)}
                                    className="gap-2"
                                    aria-label="Upload event documentation"
                                >
                                    <Upload className="h-4 w-4" /> Upload
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Photos */}
                                    <Card className="h-fit">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4 text-primary" /> Photos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedEvent?.documentation.filter((d:any) => d.type === 'photo').length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">No photos yet</div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                {selectedEvent?.documentation.filter((d:any) => d.type === 'photo').map((doc:any) => (
                                                    <div
                                                        key={doc.id}
                                                        className="group relative aspect-square rounded-md overflow-hidden bg-muted cursor-pointer transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                                        onClick={() => onViewImage(doc)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                onViewImage(doc);
                                                            }
                                                        }}
                                                        tabIndex={0}
                                                        role="button"
                                                        aria-label={`View photo: ${doc.title || 'Untitled'}`}
                                                    >
                                                        <img src={`/storage/${doc.file_path}`} className="object-cover w-full h-full" alt={doc.title} />
                                                        
                                                        {/* Simple "View Fullscreen" Overlay */}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                            <div className="bg-white/90 text-black px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                                                                <Maximize2 className="h-3.5 w-3.5" /> View
                                                            </div>
                                                        </div>

                                                        {/* Delete Button */}
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                            <Button
                                                                size="icon"
                                                                variant="destructive"
                                                                className="h-7 w-7 rounded-full shadow-md"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteDocumentation(doc.id)
                                                                }}
                                                                aria-label={`Delete photo: ${doc.title || 'Untitled'}`}
                                                            >
                                                                <X className="h-3.5 w-3.5"/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                    </Card>
                                    
                                    {/* Docs & Summary Stack */}
                                    <div className="space-y-6">
                                        <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" /> Documents
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {selectedEvent?.documentation.filter((d:any) => d.type === 'document').length === 0 ? (
                                                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">No documents uploaded</div>
                                            ) : (
                                                selectedEvent?.documentation.filter((d:any) => d.type === 'document').map((doc:any) => (
                                                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="p-2 bg-primary/10 text-primary rounded-md"><FileText className="h-4 w-4"/></div>
                                                            <span className="text-sm font-medium truncate">{doc.title}</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8"
                                                                onClick={() => window.open(`/storage/${doc.file_path}`, "_blank")}
                                                                aria-label={`Download ${doc.title || 'document'}`}
                                                            >
                                                                <Download className="h-4 w-4"/>
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                onClick={() => handleDeleteDocumentation(doc.id)}
                                                                aria-label={`Delete document: ${doc.title || 'Untitled'}`}
                                                            >
                                                                <X className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </CardContent>
                                        </Card>

                                        {/* Summary */}
                                        <Card className="border-amber-200/50 dark:border-amber-900/50">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-amber-500" /> Event Summary
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {selectedEvent?.documentation.filter((d:any) => d.type === 'summary').length === 0 ? (
                                                    <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg bg-amber-50/30">No summary added yet. Use the upload button to add one.</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {selectedEvent?.documentation.filter((d:any) => d.type === 'summary').map((doc:any) => (
                                                        <div key={doc.id} className="bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50 relative group">
                                                            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">{doc.title || "Summary"}</h4>
                                                            <p className="text-sm text-amber-800/80 dark:text-amber-200/80 whitespace-pre-wrap">{doc.description}</p>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-amber-900/40 hover:text-red-500"
                                                                onClick={() => handleDeleteDocumentation(doc.id)}
                                                                aria-label={`Delete summary: ${doc.title || 'Untitled'}`}
                                                            >
                                                                <X className="h-3 w-3"/>
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                        </Card>
                                    </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="participants" className="mt-0 space-y-6">
                            {/* Feedback Statistics */}
                            {feedbackStats && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Star className="h-4 w-4 text-amber-500" />
                                                Feedback Overview
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Response Rate</span>
                                                <span className="text-2xl font-bold">
                                                    {approvedCount > 0
                                                        ? Math.round((feedbackStats.total_responses / approvedCount) * 100)
                                                        : 0}%
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Average Rating</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-bold">
                                                        {feedbackStats.average_rating
                                                            ? feedbackStats.average_rating.toFixed(1)
                                                            : 'N/A'}
                                                    </span>
                                                    {feedbackStats.average_rating > 0 && (
                                                        <div className="flex">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={star}
                                                                    className={`h-4 w-4 ${
                                                                        star <= Math.round(feedbackStats.average_rating)
                                                                            ? "fill-amber-400 text-amber-400"
                                                                            : "text-gray-300"
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {feedbackStats.total_responses} of {approvedCount} participants submitted feedback
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">Rating Distribution</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {[5, 4, 3, 2, 1].map((rating) => {
                                                    const count = feedbackStats.rating_distribution[rating.toString() as keyof typeof feedbackStats.rating_distribution];
                                                    const percentage = feedbackStats.total_responses > 0
                                                        ? Math.round((count / feedbackStats.total_responses) * 100)
                                                        : 0;

                                                    return (
                                                        <div key={rating} className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1 w-12">
                                                                <span className="text-sm font-medium">{rating}</span>
                                                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                            </div>
                                                            <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-amber-400 transition-all"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm text-muted-foreground w-16 text-right">
                                                                {count} ({percentage}%)
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Participants Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Participant List with Feedback</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loadingParticipants ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : participants.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                            <p>No participants found</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Participant</TableHead>
                                                        <TableHead>Faculty</TableHead>
                                                        <TableHead className="text-center">Rating</TableHead>
                                                        <TableHead>Feedback</TableHead>
                                                        <TableHead className="text-right">Submitted</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {participants.map((participant) => (
                                                        <TableRow key={participant.id}>
                                                            <TableCell>
                                                                <div>
                                                                    <div className="font-medium">{participant.name}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {participant.matric_id || participant.email}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {participant.faculty}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {participant.feedback ? (
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <div className="flex">
                                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                                <Star
                                                                                    key={star}
                                                                                    className={`h-4 w-4 ${
                                                                                        star <= participant.feedback!.rating
                                                                                            ? "fill-amber-400 text-amber-400"
                                                                                            : "text-gray-300"
                                                                                    }`}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                        <span className="text-sm font-medium ml-1">
                                                                            {participant.feedback.rating}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center">
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            No feedback
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="max-w-md">
                                                                {participant.feedback?.comment ? (
                                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                                        {participant.feedback.comment}
                                                                    </p>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground italic">
                                                                        No comment provided
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right text-xs text-muted-foreground">
                                                                {participant.feedback
                                                                    ? new Date(participant.feedback.submitted_at).toLocaleDateString()
                                                                    : '—'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </>
    );
});
AnalyticsModalContent.displayName = "AnalyticsModalContent";

// ----------------------------------

export default function ManageAnalytics() {
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<PastEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<PastEvent | null>(null);
  const [eventAnalytics, setEventAnalytics] = useState<EventAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // New State for Tabs Persistence
  const [activeTab, setActiveTab] = useState("overview");

  // Image View State (Lightbox) stores object now
  const [viewingImage, setViewingImage] = useState<Documentation | null>(null);

  // Upload states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"photo" | "document" | "summary">("photo");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  // Delete states
  const [docToDelete, setDocToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Participant feedback states
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    fetchPastEvents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEvents(pastEvents);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEvents(
        pastEvents.filter(
          (event) =>
            event.name.toLowerCase().includes(query) ||
            event.location.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, pastEvents]);

  const fetchPastEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/manager/past-events-analytics", {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (response.data.success) {
        setPastEvents(response.data.past_events);
        setFilteredEvents(response.data.past_events);
      } else {
        throw new Error(response.data.message || 'Failed to fetch past events');
      }
    } catch (error: any) {
      console.error("Error fetching past events:", error);
      const errorMessage = error.response?.data?.message 
        || error.response?.statusText 
        || error.message 
        || 'Failed to load past events';
      const statusCode = error.response?.status;
      
      if (statusCode === 404) {
        toast.error("Route not found", {
          description: "The analytics API endpoint may not be registered. Please clear route cache in production.",
        });
      } else if (statusCode === 403) {
        toast.error("Access denied", {
          description: "You don't have permission to access this resource.",
        });
      } else if (statusCode === 401) {
        toast.error("Unauthorized", {
          description: "Please log in again.",
        });
      } else {
        toast.error("Failed to load past events", {
          description: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEventAnalytics = async (eventId: number) => {
    try {
      setLoadingAnalytics(true);
      const response = await axios.get(`/api/manager/events/${eventId}/analytics`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (response.data.success) {
        setEventAnalytics(response.data.analytics);
      } else {
        throw new Error(response.data.message || 'Failed to fetch event analytics');
      }
    } catch (error: any) {
      console.error("Error fetching event analytics:", error);
      const errorMessage = error.response?.data?.message 
        || error.response?.statusText 
        || error.message 
        || 'Failed to load event analytics';
      toast.error("Failed to load event analytics", {
        description: errorMessage,
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchEventParticipants = async (eventId: number) => {
    try {
      setLoadingParticipants(true);
      const response = await axios.get(`/api/manager/events/${eventId}/participants`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (response.data.success) {
        setParticipants(response.data.participants);
        setFeedbackStats(response.data.feedback_stats);
      } else {
        throw new Error(response.data.message || 'Failed to fetch participants');
      }
    } catch (error: any) {
      console.error("Error fetching participants:", error);
      const errorMessage = error.response?.data?.message 
        || error.response?.statusText 
        || error.message 
        || 'Failed to load participant data';
      toast.error("Failed to load participant data", {
        description: errorMessage,
      });
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleViewAnalytics = (event: PastEvent) => {
    setSelectedEvent(event);
    setActiveTab("overview"); // Reset tab when opening new event
    fetchEventAnalytics(event.id);
    fetchEventParticipants(event.id);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setEventAnalytics(null);
  };

  const handleUploadDocumentation = async () => {
    if (!selectedEvent) return;
    if (uploadType !== "summary" && !uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("type", uploadType);
      formData.append("title", uploadTitle);
      formData.append("description", uploadDescription);
      if (uploadFile) formData.append("file", uploadFile);

      const response = await axios.post(`/events/${selectedEvent.id}/documentation`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success("Documentation uploaded successfully");
        setUploadModalOpen(false);
        // Reset form
        setUploadFile(null);
        setUploadTitle("");
        setUploadDescription("");

        // Refresh event data locally
        const eventsResponse = await axios.get("/api/manager/past-events-analytics");
        if (eventsResponse.data.success) {
          setPastEvents(eventsResponse.data.past_events);
          // Manually update selected event to reflect new docs count
          const updatedEvent = eventsResponse.data.past_events.find((e: PastEvent) => e.id === selectedEvent.id);
          if (updatedEvent) setSelectedEvent(updatedEvent);
        }
        await fetchEventAnalytics(selectedEvent.id);
      }
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Failed to upload documentation");
    } finally {
      setUploading(false);
    }
  };

  // Trigger modal open
  const handleDeleteDocumentation = (docId: number) => {
    setDocToDelete(docId);
  };

  // Actual Delete Logic
  const confirmDeleteDocumentation = async () => {
    if (!selectedEvent || !docToDelete) return;

    try {
      setIsDeleting(true);
      await axios.delete(`/events/${selectedEvent.id}/documentation/${docToDelete}`);
      toast.success("Deleted successfully");

      const eventsResponse = await axios.get("/api/manager/past-events-analytics");
      if (eventsResponse.data.success) {
        setPastEvents(eventsResponse.data.past_events);
        const updatedEvent = eventsResponse.data.past_events.find((e: PastEvent) => e.id === selectedEvent.id);
        if (updatedEvent) setSelectedEvent(updatedEvent);
      }
      await fetchEventAnalytics(selectedEvent.id);
    } catch (e) {
        console.error(e);
        toast.error("Failed to delete item");
    } finally {
        setIsDeleting(false);
        setDocToDelete(null);
    }
  };

  const handleToggleGalleryVisibility = (event: PastEvent) => {
    router.post(`/events/${event.id}/toggle-gallery-visibility`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        // Update local state immediately
        const updatedEvents = pastEvents.map(e =>
          e.id === event.id ? { ...e, is_gallery_visible: !e.is_gallery_visible } : e
        );
        setPastEvents(updatedEvents);

        if (selectedEvent?.id === event.id) {
          setSelectedEvent({ ...selectedEvent, is_gallery_visible: !selectedEvent.is_gallery_visible });
        }

        toast.success(
          !event.is_gallery_visible
            ? "Event is now visible in gallery"
            : "Event is now hidden from gallery"
        );
      },
    });
  };

  // Optimization: Memoize chart data
  const participationData = useMemo(() => {
    if (!eventAnalytics) return [];
    return [
      { name: "Approved", value: eventAnalytics.metrics.approved_participants, fill: "#10b981" },
      // Removed Pending
      { name: "Rejected", value: eventAnalytics.metrics.rejected_participants, fill: "#ef4444" },
    ].filter((item) => item.value > 0);
  }, [eventAnalytics]);

  const facultyData = useMemo(() => {
    if (!eventAnalytics) return [];
    return Object.entries(eventAnalytics.demographics.faculty_breakdown)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [eventAnalytics]);

  const timelineData = useMemo(() => {
    if (!eventAnalytics) return [];
    return eventAnalytics.timeline.registration_timeline.map((item) => ({
      date: formatDate(item.date),
      registrations: item.count,
    }));
  }, [eventAnalytics]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Past Events Analytics" />

      <div className="flex flex-col gap-8 p-6 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ChartBar className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Past Events Analytics</h1>
              <p className="text-muted-foreground">
                Review performance metrics and documentation for concluded events
              </p>
            </div>
          </div>
          
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 bg-background/50 backdrop-blur-sm transition-all focus:bg-background"
            />
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
          </div>
        </div>

        {/* Events Table Card */}
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <div className="text-muted-foreground animate-pulse">Loading events...</div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="bg-muted/50 p-6 rounded-full mb-4">
                    <ChartBar className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium">No events found</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  {searchQuery
                    ? "Try adjusting your search terms to find what you're looking for."
                    : "Once events conclude, they will appear here for analysis."}
                </p>
                {searchQuery && (
                    <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                        <FilterX className="mr-2 h-4 w-4" /> Clear Filter
                    </Button>
                )}
              </div>
            ) : (
              <div className="relative w-full overflow-auto max-h-[calc(100vh-250px)]">
                  <Table>
                    {/* Optimized: Removed backdrop-blur-md from sticky header for performance */}
                    <TableHeader className="bg-background sticky top-0 z-10 shadow-sm">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6 w-[350px]">Event Details</TableHead>
                        <TableHead>Date & Location</TableHead>
                        <TableHead className="text-center">Attendance</TableHead>
                        <TableHead className="text-center">Hours Logged</TableHead>
                        <TableHead className="text-center">Revenue</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event.id} className="group hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-muted border border-border/50">
                                {event.image_path ? (
                                  <img
                                    src={`/storage/${event.image_path}`}
                                    alt={event.name}
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate max-w-[200px]" title={event.name}>{event.name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground border-border/60">
                                        {event.approved_participants_count}/{event.capacity}
                                    </Badge>
                                    {event.has_documentation && (
                                        <div className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 rounded-full border border-blue-100">
                                            <FileText className="h-3 w-3" /> Docs
                                        </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(event.end_date)}
                                </span>
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span className="truncate max-w-[150px]">{event.location}</span>
                                </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                                <Badge
                                variant="secondary"
                                className={`${
                                    event.attendance_rate >= 80
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : event.attendance_rate >= 50
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                } hover:bg-opacity-80`}
                                >
                                {event.attendance_rate}% Rate
                                </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm font-medium text-muted-foreground">
                             {(event.total_volunteer_hours || 0).toLocaleString()} hrs
                          </TableCell>
                          <TableCell className="text-center text-sm">
                             {event.fee && event.revenue > 0 ? (
                                 <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                                   RM {(event.revenue || 0).toFixed(2)}
                                 </span>
                             ) : (
                                 <span className="text-muted-foreground/50">—</span>
                             )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-2 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all shadow-sm"
                              onClick={() => handleViewAnalytics(event)}
                            >
                              View Analytics <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Modal - Optimized with Sub-Component and reduced blur */}
        <Dialog open={!!selectedEvent} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-[95vw] md:max-w-5xl h-[90vh] p-0 gap-0 flex flex-col bg-background/95 backdrop-blur-sm overflow-hidden [&>button]:hidden focus:outline-none">
            {loadingAnalytics ? (
                <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="text-muted-foreground">Gathering data...</span>
                    </div>
                </div>
            ) : (
                <AnalyticsModalContent
                    eventAnalytics={eventAnalytics}
                    selectedEvent={selectedEvent}
                    handleCloseModal={handleCloseModal}
                    handleToggleGalleryVisibility={handleToggleGalleryVisibility}
                    setUploadModalOpen={setUploadModalOpen}
                    handleDeleteDocumentation={handleDeleteDocumentation}
                    facultyData={facultyData}
                    participationData={participationData}
                    timelineData={timelineData}
                    activeTab={activeTab}      // Passed from parent
                    onTabChange={setActiveTab} // Passed from parent
                    onViewImage={setViewingImage} // New Prop for Lightbox
                    participants={participants}
                    feedbackStats={feedbackStats}
                    loadingParticipants={loadingParticipants}
                />
            )}
          </DialogContent>
        </Dialog>

        {/* Image Viewer Lightbox Modal */}
        <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
            <DialogContent className="max-w-[95vw] md:max-w-screen-xl border-none bg-transparent shadow-none p-0 flex flex-col items-center justify-center [&>button]:hidden">
                {viewingImage && (
                    <div className="relative flex flex-col items-center max-w-4xl w-full">
                        <div className="relative">
                            <img 
                                src={`/storage/${viewingImage.file_path}`} 
                                alt={viewingImage.title || "Image"} 
                                className="max-h-[75vh] w-auto rounded-lg shadow-2xl ring-1 ring-white/10"
                            />
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute -top-3 -right-3 md:-right-12 md:top-0 h-10 w-10 rounded-full shadow-lg bg-background/80 hover:bg-background backdrop-blur-md"
                                onClick={() => setViewingImage(null)}
                                aria-label="Close image viewer"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        
                        {/* Title & Description Caption */}
                        <div className="bg-background/90 backdrop-blur-md text-foreground p-4 rounded-lg mt-4 max-w-2xl w-full text-center border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h3 className="font-semibold text-lg">{viewingImage.title || "Untitled Image"}</h3>
                            {viewingImage.description && <p className="text-muted-foreground text-sm mt-1">{viewingImage.description}</p>}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>

        {/* Upload Documentation Modal */}
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Documentation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Content Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {["photo", "document", "summary"].map((t) => (
                      <div 
                        key={t}
                        onClick={() => setUploadType(t as any)}
                        className={`cursor-pointer text-center py-2 text-sm rounded-md border transition-all ${uploadType === t ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'hover:bg-muted'}`}
                      >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                      </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Title</label>
                    <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="E.g., Group Photo, Financial Report..." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Description</label>
                    <textarea 
                        value={uploadDescription} 
                        onChange={(e) => setUploadDescription(e.target.value)} 
                        className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Add some details..."
                    />
                  </div>
                  {uploadType !== "summary" && (
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-semibold uppercase text-muted-foreground block">Attachment</label>
                            <span className="text-[10px] text-muted-foreground">
                                {uploadType === 'photo' ? 'JPG, PNG, GIF up to 5MB' : 'PDF, DOCX, XLSX up to 10MB'}
                            </span>
                        </div>
                        <Input 
                            type="file" 
                            accept={uploadType === 'photo' ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"}
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                            className="cursor-pointer text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                    </div>
                  )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setUploadModalOpen(false)} disabled={uploading}>Cancel</Button>
                <Button onClick={handleUploadDocumentation} disabled={uploading}>{uploading ? "Uploading..." : "Save Content"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="gap-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                    </div>
                    <DialogDescription>
                        Are you sure you want to delete this documentation? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => setDocToDelete(null)} disabled={isDeleting}>Cancel</Button>
                    <Button variant="destructive" onClick={confirmDeleteDocumentation} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete Item"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}