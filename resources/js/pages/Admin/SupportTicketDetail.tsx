import { useState, FormEvent } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { ArrowLeft, User, Mail, Calendar, MessageSquare, Save, Trash2, Tag, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import type { BreadcrumbItem } from "@/types";

interface SupportTicket {
  id: number;
  subject: string;
  message: string;
  category: 'general' | 'technical' | 'account' | 'event' | 'payment' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved';
  user: { id: number; name: string; email: string; profile_picture?: string };
  admin_response: string | null;
  responded_by: { id: number; name: string } | null;
  responded_at: string | null;
  created_at: string;
}

interface Props {
  ticket: SupportTicket;
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'in_progress': return 'In Progress';
    case 'resolved': return 'Resolved';
    default: return status;
  }
};

export default function SupportTicketDetail({ ticket: initialTicket }: Props) {
  const [ticket, setTicket] = useState(initialTicket);
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [adminResponse, setAdminResponse] = useState(ticket.admin_response || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      general: 'General Inquiry',
      technical: 'Technical Issue',
      account: 'Account Problem',
      event: 'Event Related',
      payment: 'Payment Issue',
      other: 'Other',
    };
    return labels[cat] || cat;
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Admin", href: "/admin/dashboard" },
    { title: "Support Tickets", href: "/admin/support-tickets" },
    { title: `Ticket #${ticket.id}`, href: `/admin/support-tickets/${ticket.id}` },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await axios.put(`/admin/support-tickets/${ticket.id}`, {
        status,
        priority,
        admin_response: adminResponse,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setTicket(response.data.ticket);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update ticket");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await axios.delete(`/admin/support-tickets/${ticket.id}`);

      if (response.data.success) {
        toast.success(response.data.message);
        router.visit('/admin/support-tickets');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete ticket");
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Ticket #${ticket.id} - ${ticket.subject}`} />
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.visit('/admin/support-tickets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>

        {/* Ticket Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className={getStatusColor(ticket.status)}>
                    {getStatusLabel(ticket.status)}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                    {ticket.priority === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Tag className="h-3 w-3 mr-1" />
                    {getCategoryLabel(ticket.category)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Ticket #{ticket.id}
                  </span>
                </div>
                <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Submitted By</p>
                  <p className="font-semibold text-foreground">{ticket.user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Email</p>
                  <p className="font-semibold text-foreground">{ticket.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Submitted On</p>
                  <p className="font-semibold text-foreground">{formatDate(ticket.created_at)}</p>
                </div>
              </div>
            </div>

            {/* User Message */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                User Message
              </h3>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                <p className="whitespace-pre-wrap text-foreground">{ticket.message}</p>
              </div>
            </div>

            {/* Response Form */}
            <form onSubmit={handleUpdate} className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Ticket Status</Label>
                  <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="response">Admin Response</Label>
                <Textarea
                  id="response"
                  placeholder="Write your response to the user..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={6}
                  maxLength={2000}
                  className="resize-none transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-background"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {adminResponse.length}/2000 characters
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all"
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Ticket
                </Button>
              </div>

              {/* Previous Response Info */}
              {ticket.responded_by && ticket.responded_at && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Last responded by <span className="font-medium">{ticket.responded_by.name}</span> on{' '}
                    {formatDate(ticket.responded_at)}
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Support Ticket
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete this ticket?</p>
              <div className="bg-muted p-3 rounded-lg mt-2">
                <p className="font-medium text-foreground">Ticket #{ticket.id}</p>
                <p className="text-sm">{ticket.subject}</p>
              </div>
              <p className="text-red-600 text-sm font-medium">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Ticket
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
