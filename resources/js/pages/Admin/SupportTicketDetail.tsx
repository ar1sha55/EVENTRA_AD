import { useState, FormEvent } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Mail, Calendar, MessageSquare, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import type { BreadcrumbItem } from "@/types";

interface SupportTicket {
  id: number;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  user: { id: number; name: string; email: string };
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
  const [adminResponse, setAdminResponse] = useState(ticket.admin_response || "");
  const [isSaving, setIsSaving] = useState(false);

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
    if (!confirm("Are you sure you want to delete this ticket?")) {
      return;
    }

    try {
      const response = await axios.delete(`/admin/support-tickets/${ticket.id}`);

      if (response.data.success) {
        toast.success(response.data.message);
        router.visit('/admin/support-tickets');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete ticket");
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
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={getStatusColor(ticket.status)}>
                    {getStatusLabel(ticket.status)}
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
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                User Message
              </h3>
              <div className="p-5 bg-muted/40 rounded-xl border-2 shadow-sm">
                <p className="whitespace-pre-wrap leading-relaxed text-foreground">{ticket.message}</p>
              </div>
            </div>

            {/* Response Form */}
            <form onSubmit={handleUpdate} className="space-y-4">
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
                  onClick={handleDelete}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Ticket
                </Button>
              </div>
            </form>

            {/* Previous Response (if exists) */}
            {ticket.responded_by && ticket.responded_at && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Last updated by {ticket.responded_by.name} on{' '}
                  {formatDate(ticket.responded_at)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </AppLayout>
  );
}
