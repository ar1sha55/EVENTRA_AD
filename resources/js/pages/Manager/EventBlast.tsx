import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import {
  MessageSquare,
  Send,
  Sparkles,
  Calendar,
  Clock,
  XCircle,
  RotateCw,
  CheckCircle2,
  Zap,
  TrendingUp,
  Smartphone,
  Info,
  ChevronRight
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Event Blast",
    href: "/manager/event-blast",
  },
];

// ... (Interfaces remain the same)
interface Event {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  capacity?: number;
  fee?: number;
}

interface Blast {
  id: number;
  event: Event;
  user: { name: string };
  message: string;
  caption?: string;
  blast_type: 'immediate' | 'scheduled';
  scheduled_at?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string;
  error_message?: string;
  telegram_message_id?: string;
}

interface CaptionStyle {
  value: string;
  label: string;
  description: string;
}

interface Props {
  events: Event[];
  blasts: {
    data: Blast[];
    current_page: number;
    last_page: number;
  };
  captionStyles: CaptionStyle[];
}

export default function EventBlastPage({ events, blasts, captionStyles }: Props) {
  const { flash } = usePage<{ flash: { success?: string } }>().props;
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [captionStyle, setCaptionStyle] = useState<string>("engaging");
  const [message, setMessage] = useState<string>("");
  const [blastType, setBlastType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Handle flash messages
  useEffect(() => {
    if (flash?.success) {
      setSuccessMessage(flash.success);
      setShowSuccessDialog(true);
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  // Handle event pre-selection from query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');

    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === parseInt(eventId));
      if (event) {
        setSelectedEvent(eventId);
      }
    }
  }, [events]);

  // Handle AI caption generation
  const handleGenerateCaption = async () => {
    if (!selectedEvent) {
      // Small shake animation or visual cue could be added here
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post('/manager/event-blast/generate-caption', {
        event_id: selectedEvent,
        style: captionStyle,
      });
      setMessage(response.data.caption);
    } catch (error) {
      console.error('Failed to generate caption:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle send blast
  const handleSendBlast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !message.trim()) return;
    if (blastType === 'scheduled' && !scheduledAt) {
      toast.error('Please select a date and time for scheduling');
      return;
    }

    setIsSending(true);

    router.post('/manager/event-blast', {
      event_id: selectedEvent,
      message: message,
      caption: message,
      blast_type: blastType,
      scheduled_at: blastType === 'scheduled' ? scheduledAt : null,
    }, {
      onSuccess: (page) => {
        const isScheduled = blastType === 'scheduled';
        const scheduledDate = isScheduled && scheduledAt 
          ? new Date(scheduledAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })
          : null;

        if (isScheduled) {
          toast.success('Blast scheduled successfully!', {
            description: scheduledDate ? `It will be sent on ${scheduledDate}` : 'Your blast has been scheduled.',
          });
        } else {
          toast.success('Blast sent successfully!', {
            description: 'Your message has been posted to the Telegram channel.',
          });
        }

        setSelectedEvent("");
        setMessage("");
        setScheduledAt("");
        setBlastType('immediate');
        setIsSending(false);
        
        // Refresh the blasts list
        router.reload({ only: ['blasts'] });
      },
      onError: (errors) => {
        setIsSending(false);
        const errorMessage = Object.values(errors).flat().join(', ') || 'Failed to send blast. Please try again.';
        toast.error('Failed to send blast', {
          description: errorMessage,
        });
      },
    });
  };

  const handleCancel = (blastId: number) => {
    if (!confirm("Cancel this scheduled blast?")) return;
    router.post(`/manager/event-blast/${blastId}/cancel`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Blast cancelled successfully');
        router.reload({ only: ['blasts'] });
      },
      onError: (errors) => {
        const errorMessage = Object.values(errors).flat().join(', ') || 'Failed to cancel blast.';
        toast.error('Failed to cancel blast', {
          description: errorMessage,
        });
      },
    });
  };

  const handleRetry = (blastId: number) => {
    router.post(`/manager/event-blast/${blastId}/retry`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Blast retry initiated', {
          description: 'The blast is being processed again.',
        });
        router.reload({ only: ['blasts'] });
      },
      onError: (errors) => {
        const errorMessage = Object.values(errors).flat().join(', ') || 'Failed to retry blast.';
        toast.error('Failed to retry blast', {
          description: errorMessage,
        });
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      sent: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-800",
      pending: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      failed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-800",
      cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.sent}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
      timeZone: 'Asia/Kuala_Lumpur'
    });
  };

  // Find selected event details for preview
  const activeEvent = events.find(e => e.id.toString() === selectedEvent);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Event Blast" />

      <div className="flex flex-col gap-8 p-4 md:p-8 max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Event Blast</h1>
              <p className="text-muted-foreground">
                Create and schedule announcements to your Telegram channel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-none">{blasts.data.length}</span>
              <span className="text-xs text-muted-foreground">Blasts Sent</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Composition Form (8 cols) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-7 xl:col-span-8 space-y-8"
          >
            <Card className="border-0 shadow-lg ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <CardHeader className="pb-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MessageSquare className="h-5 w-5 text-indigo-600" />
                  Compose Message
                </CardTitle>
                <CardDescription>
                  Select an event and let AI help you write the perfect announcement.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 md:p-8 space-y-8">
                {/* Event & Style Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Event</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger className="h-11 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-indigo-500">
                        <SelectValue placeholder="Choose an event..." />
                      </SelectTrigger>
                      <SelectContent>
                        {events.length === 0 ? (
                          <SelectItem value="none" disabled>No events available</SelectItem>
                        ) : (
                          events.map((e) => (
                            <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tone of Voice</Label>
                    <Select value={captionStyle} onValueChange={setCaptionStyle}>
                      <SelectTrigger className="h-11 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {captionStyles.map((style) => (
                          <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Message Area */}
                <div className="space-y-3 relative group">
                  <div className="flex justify-between items-end">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Caption Content</Label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleGenerateCaption}
                      disabled={!selectedEvent || isGenerating}
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all shadow-sm"
                    >
                      {isGenerating ? (
                        <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {isGenerating ? "Magic in progress..." : "Auto-Generate with AI"}
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Select an event and click 'Auto-Generate', or type your message here..."
                      className="flex w-full min-h-[280px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 resize-none leading-relaxed shadow-inner"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-white/80 dark:bg-black/80 backdrop-blur px-2 py-1 rounded-md">
                      {message.length} chars
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p>A link to the event registration page will be automatically appended to the bottom of your message.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scheduling Card */}
            <Card className="border-0 shadow-lg ring-1 ring-gray-200 dark:ring-gray-800">
              <CardContent className="p-6 md:p-8">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sending Options</Label>
                      <RadioGroup 
                        value={blastType} 
                        onValueChange={(v) => setBlastType(v as 'immediate' | 'scheduled')}
                        className="flex flex-col sm:flex-row gap-4"
                      >
                        <div className={`flex items-center space-x-3 border rounded-lg p-4 transition-all cursor-pointer ${blastType === 'immediate' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-indigo-300'}`}>
                          <RadioGroupItem value="immediate" id="immediate" />
                          <Label htmlFor="immediate" className="cursor-pointer">
                            <span className="font-medium block">Send Immediately</span>
                            <span className="text-xs text-muted-foreground">Post to channel now</span>
                          </Label>
                        </div>
                        <div className={`flex items-center space-x-3 border rounded-lg p-4 transition-all cursor-pointer ${blastType === 'scheduled' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-indigo-300'}`}>
                          <RadioGroupItem value="scheduled" id="scheduled" />
                          <Label htmlFor="scheduled" className="cursor-pointer">
                            <span className="font-medium block">Schedule for Later</span>
                            <span className="text-xs text-muted-foreground">Pick a specific time</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <AnimatePresence>
                      {blastType === 'scheduled' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="w-full md:w-64 space-y-2"
                        >
                          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Date & Time</Label>
                          <div className="relative">
                            <input
                              type="datetime-local"
                              value={scheduledAt}
                              onChange={(e) => setScheduledAt(e.target.value)}
                              min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                              className="w-full h-11 pl-3 pr-3 rounded-md border border-gray-300 dark:border-gray-700 bg-background text-sm focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>

                 <Separator className="my-6" />

                 <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => {setMessage(''); setSelectedEvent('');}} disabled={isSending}>
                      Reset
                    </Button>
                    <Button 
                      onClick={handleSendBlast} 
                      disabled={isSending || !selectedEvent || !message.trim()}
                      size="lg"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px] shadow-lg shadow-indigo-500/20"
                    >
                      {isSending ? (
                        <>
                          <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {blastType === 'immediate' ? <Send className="mr-2 h-4 w-4" /> : <Calendar className="mr-2 h-4 w-4" />}
                          {blastType === 'immediate' ? "Send Blast" : "Schedule Blast"}
                        </>
                      )}
                    </Button>
                 </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* RIGHT COLUMN: Live Preview (4 cols) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 xl:col-span-4"
          >
            <div className="sticky top-8 space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200 px-1">
                <Smartphone className="h-5 w-5" />
                <h3>Live Preview</h3>
              </div>

              {/* Telegram Phone Mockup */}
              <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-full max-w-[360px] shadow-xl flex flex-col overflow-hidden">
                <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
                
                {/* Screen Content */}
                <div className="flex-1 rounded-[2rem] overflow-hidden bg-[#8c9bb2] dark:bg-[#1a202c] relative flex flex-col">
                  {/* Telegram Header */}
                  <div className="bg-[#517da2] dark:bg-[#263242] p-3 pt-8 flex items-center gap-3 text-white shadow-md z-10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-300 flex items-center justify-center text-xs font-bold">
                      V
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">VOLUNTEER@UTM</div>
                      <div className="text-[10px] opacity-80">100 subscribers</div>
                    </div>
                  </div>

                  {/* Telegram Chat Area */}
                  <div className="flex-1 p-3 overflow-y-auto bg-[url('https://i.pinimg.com/originals/97/66/5d/97665d83633e9b1776b772076046e72f.jpg')] bg-cover">
                    <AnimatePresence>
                      {(message || selectedEvent) && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="bg-white dark:bg-[#2b394b] rounded-lg rounded-tl-none p-3 shadow-sm max-w-[90%] mb-2"
                        >
                          {/* Event Name as Title */}
                          {activeEvent && (
                            <div className="text-[#3b82f6] font-bold text-sm mb-1">{activeEvent.name}</div>
                          )}
                          
                          {/* Message Body */}
                          <div className="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                            {message || <span className="text-gray-400 italic">Your message will appear here...</span>}
                          </div>
                          
                          {/* Link Preview Mockup */}
                          {activeEvent && (
                            <div className="mt-2 text-[#3b82f6] text-xs underline decoration-dotted">
                              https://yourapp.com/events/{activeEvent.id}
                            </div>
                          )}

                          <div className="text-[9px] text-gray-400 text-right mt-1 flex justify-end items-center gap-1">
                             {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             <CheckCircle2 className="h-2 w-2" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Input Mockup */}
                  <div className="bg-white dark:bg-[#263242] p-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    <div className="h-8 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full"></div>
                    <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* BOTTOM SECTION: History Table */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg ring-1 ring-gray-200 dark:ring-gray-800">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Blasts</CardTitle>
                  <CardDescription>Track the status of your announcements.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => router.visit('/manager/event-blast')}>
                  Refresh List
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {blasts.data.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <Send className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No blasts yet</h3>
                  <p className="text-gray-500 mt-1">Create your first announcement above.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-900">
                    <TableRow>
                      <TableHead className="w-[30%]">Event Name</TableHead>
                      <TableHead>Scheduled / Sent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blasts.data.map((blast) => (
                      <TableRow key={blast.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <TableCell>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{blast.event.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                             <Zap className="h-3 w-3" />
                             {blast.blast_type === 'immediate' ? 'Immediate Blast' : 'Scheduled Blast'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                          {blast.status === 'sent' ? (
                            <div className="flex flex-col">
                              <span>{formatDate(blast.sent_at)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                              <Calendar className="h-3 w-3" />
                              {blast.blast_type === 'scheduled' ? formatDate(blast.scheduled_at) : 'Processing...'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(blast.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {blast.status === 'pending' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => handleCancel(blast.id)}
                              >
                                Cancel
                              </Button>
                            )}
                            {blast.status === 'failed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-red-200 hover:bg-red-50 text-red-600"
                                onClick={() => handleRetry(blast.id)}
                              >
                                <RotateCw className="h-3 w-3 mr-1" /> Retry
                              </Button>
                            )}
                            {blast.status === 'sent' && (
                               <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
                                 <CheckCircle2 className="h-4 w-4 text-green-500" />
                               </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Success Dialog */}
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent className="max-w-md rounded-2xl">
            <AlertDialogHeader className="items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <AlertDialogTitle className="text-xl font-bold">Blast Initiated!</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                {successMessage || 'Your event blast has been processed successfully.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <AlertDialogAction
                onClick={() => setShowSuccessDialog(false)}
                className="w-full sm:w-auto px-8 rounded-xl bg-green-600 hover:bg-green-700"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AppLayout>
  );
}