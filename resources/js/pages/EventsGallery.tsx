import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import {
  ImageIcon,
  Search,
  Calendar,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  FilterX,
  Images,
  FileText,
  Download,
  BarChart3,
  Award,
  Clock,
  Star,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Events Gallery", href: "/events-gallery" },
];

interface Documentation {
  id: number;
  file_path: string;
  title: string | null;
  description: string | null;
  type: 'photo' | 'document' | 'summary';
}

interface UserFeedback {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface GalleryEvent {
  id: number;
  name: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  image_path: string | null;
  approved_participants_count: number;
  attendance_rate: number;
  photos: Documentation[];
  documents: Documentation[];
  summaries: Documentation[];
  photos_count: number;
  documents_count: number;
  summaries_count: number;
  total_documentation_count: number;
  user_feedback: UserFeedback | null;
  can_submit_feedback: boolean;
}

export default function EventsGallery() {
  const [events, setEvents] = useState<GalleryEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<GalleryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<GalleryEvent | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEvents(events);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEvents(
        events.filter(
          (event) =>
            event.name.toLowerCase().includes(query) ||
            event.location.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, events]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/events-gallery");
      if (response.data.success) {
        setEvents(response.data.events);
        setFilteredEvents(response.data.events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events gallery");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleEventClick = (event: GalleryEvent) => {
    setSelectedEvent(event);
    setCurrentPhotoIndex(0);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setCurrentPhotoIndex(0);
  };

  const handleNextPhoto = () => {
    if (selectedEvent && currentPhotoIndex < selectedEvent.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const handlePrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedEvent) {
      if (e.key === "ArrowRight") handleNextPhoto();
      if (e.key === "ArrowLeft") handlePrevPhoto();
      if (e.key === "Escape") handleCloseModal();
    }
  };

  // Feedback handlers
  const handleSubmitFeedback = async () => {
    if (!selectedEvent || feedbackRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmittingFeedback(true);
      const response = await axios.post(`/api/events/${selectedEvent.id}/feedback`, {
        rating: feedbackRating,
        comment: feedbackComment.trim() || null,
      });

      if (response.data.success) {
        toast.success(response.data.message);

        // Refresh events to show updated feedback
        await fetchEvents();

        // Update selected event if modal is still open
        if (selectedEvent) {
          const updatedEvent = events.find(e => e.id === selectedEvent.id);
          if (updatedEvent) setSelectedEvent(updatedEvent);
        }
      }
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const openFeedbackEditor = (event: GalleryEvent) => {
    // Pre-populate if feedback exists
    if (event.user_feedback) {
      setFeedbackRating(event.user_feedback.rating);
      setFeedbackComment(event.user_feedback.comment || "");
    } else {
      setFeedbackRating(0);
      setFeedbackComment("");
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown as any);
    return () => window.removeEventListener("keydown", handleKeyDown as any);
  }, [selectedEvent, currentPhotoIndex]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Events Gallery" />

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Images className="h-4 w-4" />
              <span>Relive the Moments</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Events Gallery
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore highlights from our past events and community moments
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search events by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-14 text-base bg-background/60 backdrop-blur-sm border-border/50 focus:border-primary shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading gallery...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-muted/50 p-8 rounded-full mb-6">
                <Images className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "No events found" : "No events yet"}
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Past events with photos will appear here"}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  <FilterX className="mr-2 h-4 w-4" /> Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50"
                  onClick={() => handleEventClick(event)}
                >
                  {/* Event Image */}
                  <div className="relative h-56 overflow-hidden bg-muted">
                    {event.image_path ? (
                      <>
                        <img
                          src={`/storage/${event.image_path}`}
                          alt={event.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <ImageIcon className="h-16 w-16 text-primary/30" />
                      </div>
                    )}

                    {/* Documentation Count Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black/60 text-white border-white/20 backdrop-blur-sm">
                        <FileText className="h-3 w-3 mr-1.5" />
                        {event.total_documentation_count} {event.total_documentation_count === 1 ? "item" : "items"}
                      </Badge>
                    </div>

                    {/* Attendance Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant="secondary"
                        className={`${
                          event.attendance_rate >= 80
                            ? "bg-emerald-500/90 text-white"
                            : event.attendance_rate >= 50
                            ? "bg-amber-500/90 text-white"
                            : "bg-gray-500/90 text-white"
                        } border-white/20 backdrop-blur-sm`}
                      >
                        <TrendingUp className="h-3 w-3 mr-1.5" />
                        {event.attendance_rate}%
                      </Badge>
                    </div>
                  </div>

                  {/* Event Details */}
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {event.name}
                    </h3>

                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{formatDate(event.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{event.approved_participants_count} participants</span>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      className="w-full mt-2 hover:bg-primary hover:text-primary-foreground"
                    >
                      View Gallery
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo Viewer Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-[95vw] md:max-w-6xl h-[90vh] p-0 gap-0 flex flex-col bg-background overflow-hidden">
          {selectedEvent && (
            <>
              {/* Header */}
              <div className="shrink-0 border-b bg-background/95 backdrop-blur-sm px-6 py-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold truncate">{selectedEvent.name}</h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selectedEvent.end_date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {selectedEvent.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {selectedEvent.approved_participants_count} participants
                    </span>
                  </div>
                </div>
              </div>

              {/* Documentation Viewer with Tabs */}
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="analytics" className="h-full flex flex-col">
                  <div className="shrink-0 border-b bg-background/95 backdrop-blur-sm px-6">
                    <TabsList className="w-full justify-start h-12">
                      <TabsTrigger value="analytics" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </TabsTrigger>
                      <TabsTrigger value="photos" className="gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Photos ({selectedEvent.photos_count})
                      </TabsTrigger>
                      <TabsTrigger value="documents" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Documents ({selectedEvent.documents_count})
                      </TabsTrigger>
                      <TabsTrigger value="summaries" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Summaries ({selectedEvent.summaries_count})
                      </TabsTrigger>
                      <TabsTrigger value="feedback" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Feedback
                        {selectedEvent.user_feedback && (
                          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                            Submitted
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Analytics Tab */}
                  <TabsContent value="analytics" className="flex-1 mt-0 data-[state=active]:flex flex-col overflow-hidden">
                    <div className="overflow-auto p-6">
                      <div className="max-w-5xl mx-auto space-y-8">
                        {/* Hero Stats */}
                        <div className="text-center mb-8">
                          <h3 className="text-3xl font-bold mb-2">Event Performance</h3>
                          <p className="text-muted-foreground">Key metrics and highlights from this event</p>
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Attendance Rate */}
                          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-emerald-500/20">
                                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Attendance Rate</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">
                                  {selectedEvent.attendance_rate}%
                                </p>
                                <div className="w-full bg-emerald-200 dark:bg-emerald-900/50 rounded-full h-2">
                                  <div
                                    className="bg-emerald-600 dark:bg-emerald-500 h-2 rounded-full transition-all"
                                    style={{ width: `${selectedEvent.attendance_rate}%` }}
                                  />
                                </div>
                                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                                  {selectedEvent.attendance_rate >= 80 ? "Excellent turnout!" :
                                   selectedEvent.attendance_rate >= 50 ? "Good participation" :
                                   "Room for improvement"}
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Total Participants */}
                          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-blue-500/20">
                                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Participants</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">
                                  {selectedEvent.approved_participants_count}
                                </p>
                                <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                                  Approved attendees
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Documentation */}
                          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-purple-500/20">
                                  <Award className="h-6 w-6 text-purple-600 dark:text-purple-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Documentation</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-4xl font-bold text-purple-700 dark:text-purple-400">
                                  {selectedEvent.total_documentation_count}
                                </p>
                                <p className="text-xs text-purple-600/80 dark:text-purple-400/80">
                                  {selectedEvent.photos_count} photos • {selectedEvent.documents_count} docs • {selectedEvent.summaries_count} summaries
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Event Details Card */}
                        <Card className="border-0 shadow-lg">
                          <CardContent className="p-6">
                            <h4 className="font-semibold text-xl mb-4 flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-primary" />
                              Event Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Event Date</p>
                                    <p className="font-medium">{new Date(selectedEvent.start_date).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                                    <p className="font-medium">{selectedEvent.location}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                                    <p className="font-medium">
                                      {Math.ceil((new Date(selectedEvent.end_date).getTime() - new Date(selectedEvent.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                                    <p className="font-medium">{selectedEvent.approved_participants_count} participants</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Event Description */}
                        {selectedEvent.description && (
                          <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                              <h4 className="font-semibold text-xl mb-4">About This Event</h4>
                              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {selectedEvent.description}
                              </p>
                            </CardContent>
                          </Card>
                        )}

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold text-primary">{selectedEvent.photos_count}</p>
                            <p className="text-xs text-muted-foreground mt-1">Photos</p>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold text-primary">{selectedEvent.documents_count}</p>
                            <p className="text-xs text-muted-foreground mt-1">Documents</p>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold text-primary">{selectedEvent.summaries_count}</p>
                            <p className="text-xs text-muted-foreground mt-1">Summaries</p>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold text-primary">{selectedEvent.attendance_rate}%</p>
                            <p className="text-xs text-muted-foreground mt-1">Attended</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  {/* Photos Tab */}
                  <TabsContent value="photos" className="flex-1 mt-0 data-[state=active]:flex flex-col overflow-hidden">
                    {selectedEvent.photos.length > 0 ? (
                      <>
                        {/* Image Viewer */}
                        <div className="flex-1 relative bg-black/5 flex items-center justify-center overflow-hidden">
                          <div className="relative w-full h-full flex items-center justify-center p-4">
                            <img
                              src={`/storage/${selectedEvent.photos[currentPhotoIndex].file_path}`}
                              alt={selectedEvent.photos[currentPhotoIndex].title || "Event photo"}
                              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                            />

                            {selectedEvent.photos.length > 1 && (
                              <>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg bg-background/80 hover:bg-background backdrop-blur-md disabled:opacity-30"
                                  onClick={handlePrevPhoto}
                                  disabled={currentPhotoIndex === 0}
                                  aria-label="Previous photo"
                                >
                                  <ChevronLeft className="h-6 w-6" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg bg-background/80 hover:bg-background backdrop-blur-md disabled:opacity-30"
                                  onClick={handleNextPhoto}
                                  disabled={currentPhotoIndex === selectedEvent.photos.length - 1}
                                  aria-label="Next photo"
                                >
                                  <ChevronRight className="h-6 w-6" />
                                </Button>
                              </>
                            )}

                            <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-background/90 backdrop-blur-md shadow-lg border">
                              <span className="text-sm font-medium">
                                {currentPhotoIndex + 1} / {selectedEvent.photos.length}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Photo Info Section - Outside Image */}
                        {(selectedEvent.photos[currentPhotoIndex].title ||
                          selectedEvent.photos[currentPhotoIndex].description) && (
                          <div className="shrink-0 border-t bg-background/95 backdrop-blur-sm px-6 py-4">
                            <div className="max-w-3xl">
                              {selectedEvent.photos[currentPhotoIndex].title && (
                                <h4 className="font-semibold text-lg mb-2">
                                  {selectedEvent.photos[currentPhotoIndex].title}
                                </h4>
                              )}
                              {selectedEvent.photos[currentPhotoIndex].description && (
                                <p className="text-muted-foreground">
                                  {selectedEvent.photos[currentPhotoIndex].description}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Thumbnail Strip */}
                        {selectedEvent.photos.length > 1 && (
                          <div className="shrink-0 border-t bg-background/95 backdrop-blur-sm p-4">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {selectedEvent.photos.map((photo, index) => (
                                <button
                                  key={photo.id}
                                  onClick={() => setCurrentPhotoIndex(index)}
                                  className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                    index === currentPhotoIndex
                                      ? "border-primary ring-2 ring-primary/20 scale-105"
                                      : "border-transparent hover:border-border"
                                  }`}
                                  aria-label={`View photo ${index + 1}`}
                                >
                                  <img
                                    src={`/storage/${photo.file_path}`}
                                    alt={photo.title || `Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                          <p>No photos available</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="flex-1 mt-0 data-[state=active]:flex flex-col overflow-hidden">
                    {selectedEvent.documents.length > 0 ? (
                      <div className="overflow-auto p-6">
                        <div className="grid gap-4 max-w-4xl mx-auto">
                          {selectedEvent.documents.map((doc) => (
                            <Card key={doc.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
                              <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                  <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                                    <FileText className="h-6 w-6 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-lg mb-2">
                                      {doc.title || "Untitled Document"}
                                    </h4>
                                    {doc.description && (
                                      <p className="text-sm text-muted-foreground mb-4">
                                        {doc.description}
                                      </p>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="default"
                                      asChild
                                    >
                                      <a
                                        href={`/storage/${doc.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="gap-2"
                                      >
                                        <Download className="h-4 w-4" />
                                        Download Document
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                          <p className="text-lg">No documents available</p>
                          <p className="text-sm mt-2">Event documents will appear here</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Summaries Tab */}
                  <TabsContent value="summaries" className="flex-1 mt-0 data-[state=active]:flex flex-col overflow-hidden">
                    {selectedEvent.summaries.length > 0 ? (
                      <div className="overflow-auto p-6">
                        <div className="max-w-4xl mx-auto space-y-6">
                          {selectedEvent.summaries.map((summary, index) => (
                            <Card key={summary.id} className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
                              <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600"></div>
                              <CardContent className="p-8">
                                <div className="flex items-start gap-4 mb-6">
                                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 shrink-0">
                                    <FileText className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/20">
                                        Summary {index + 1}
                                      </Badge>
                                    </div>
                                    <h4 className="font-bold text-2xl mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                      {summary.title || "Event Summary"}
                                    </h4>
                                  </div>
                                </div>

                                {summary.description && (
                                  <div className="prose prose-sm max-w-none mb-6">
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base">
                                      {summary.description}
                                    </p>
                                  </div>
                                )}

                                {summary.file_path && (
                                  <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                      size="default"
                                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
                                      asChild
                                    >
                                      <a
                                        href={`/storage/${summary.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="gap-2"
                                      >
                                        <Download className="h-4 w-4" />
                                        Download Full Summary
                                      </a>
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <div className="inline-flex p-6 rounded-full bg-amber-500/10 mb-4">
                            <FileText className="h-16 w-16 text-amber-500/30" />
                          </div>
                          <p className="text-lg font-medium">No summaries available</p>
                          <p className="text-sm mt-2">Event summaries and recaps will appear here</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Feedback Tab */}
                  <TabsContent value="feedback" className="flex-1 mt-0 data-[state=active]:flex flex-col overflow-hidden">
                    <div className="overflow-auto p-6">
                      <div className="max-w-2xl mx-auto space-y-6">
                        {selectedEvent.can_submit_feedback ? (
                          <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                              <h3 className="text-xl font-bold mb-4">Share Your Experience</h3>

                              {/* Star Rating */}
                              <div className="space-y-3 mb-6">
                                <label className="text-sm font-medium">
                                  How would you rate this event?
                                </label>
                                <div className="flex gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setFeedbackRating(star)}
                                      onMouseEnter={() => setHoveredStar(star)}
                                      onMouseLeave={() => setHoveredStar(0)}
                                      className="transition-transform hover:scale-110"
                                    >
                                      <Star
                                        className={`h-10 w-10 ${
                                          star <= (hoveredStar || feedbackRating)
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                                {feedbackRating > 0 && (
                                  <p className="text-sm text-muted-foreground">
                                    {feedbackRating === 5
                                      ? "Excellent!"
                                      : feedbackRating === 4
                                      ? "Great!"
                                      : feedbackRating === 3
                                      ? "Good"
                                      : feedbackRating === 2
                                      ? "Fair"
                                      : "Poor"}
                                  </p>
                                )}
                              </div>

                              {/* Comment */}
                              <div className="space-y-3">
                                <label className="text-sm font-medium">
                                  Comments (Optional)
                                </label>
                                <textarea
                                  value={feedbackComment}
                                  onChange={(e) => setFeedbackComment(e.target.value)}
                                  placeholder="Share your thoughts about the event..."
                                  className="w-full min-h-[120px] px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                  maxLength={1000}
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                  {feedbackComment.length}/1000 characters
                                </p>
                              </div>

                              {/* Submit Button */}
                              <div className="flex justify-end gap-3 mt-6">
                                <Button
                                  onClick={handleSubmitFeedback}
                                  disabled={submittingFeedback || feedbackRating === 0}
                                  className="gap-2"
                                >
                                  {submittingFeedback ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                      Submitting...
                                    </>
                                  ) : selectedEvent.user_feedback ? (
                                    "Update Feedback"
                                  ) : (
                                    "Submit Feedback"
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : selectedEvent.user_feedback ? (
                          // Display submitted feedback (read-only)
                          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
                            <CardContent className="p-6">
                              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-amber-600" />
                                Your Feedback
                              </h3>

                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-2">
                                    Rating
                                  </p>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-6 w-6 ${
                                          star <= selectedEvent.user_feedback!.rating
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>

                                {selectedEvent.user_feedback.comment && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                      Comment
                                    </p>
                                    <p className="text-sm bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                                      {selectedEvent.user_feedback.comment}
                                    </p>
                                  </div>
                                )}

                                <p className="text-xs text-muted-foreground">
                                  Submitted on{" "}
                                  {new Date(
                                    selectedEvent.user_feedback.created_at
                                  ).toLocaleDateString()}
                                </p>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openFeedbackEditor(selectedEvent)}
                                  className="w-full"
                                >
                                  Edit Feedback
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          // Cannot submit feedback
                          <Card className="border-0 shadow-lg">
                            <CardContent className="p-6 text-center">
                              <div className="bg-muted/50 p-6 rounded-full mb-4 inline-block">
                                <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                              </div>
                              <h3 className="text-lg font-semibold mb-2">
                                Feedback Not Available
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                You can only submit feedback for events you attended as an approved
                                participant.
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
