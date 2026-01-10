import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Send, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import axios from "axios";

interface Announcement {
  id: number;
  title: string;
  message: string;
  recipients_count: number;
  sent_at: string;
  user: { id: number; name: string };
}

interface Props {
  announcements: {
    data: Announcement[];
    links: any[];
    current_page: number;
    last_page: number;
  };
}

export default function SendAnnouncementsPage({ announcements: initialAnnouncements }: Props) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSending(true);

    try {
      const response = await axios.post('/manager/announcements', { title, message });

      if (response.data.success) {
        toast.success(response.data.message);
        setTitle("");
        setMessage("");

        const historyResponse = await axios.get('/manager/announcements/history');
        setAnnouncements(historyResponse.data);

        window.dispatchEvent(new Event('notification-created'));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send announcement");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout breadcrumbs={[{ title: "Send Announcement", href: "/send-announcement" }]}>
      <Head title="Send Announcement" />
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Megaphone className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Send Announcement</h1>
            <p className="text-muted-foreground">
              Broadcast messages to all members via notification and email
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-sm max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Create Announcement
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Send an announcement to all members via notification and email
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter announcement title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Enter your announcement message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  maxLength={1000}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {message.length}/1000 characters
                </p>
              </div>

              <Button type="submit" disabled={isSending} className="self-end px-6 py-2 mt-2">
                {isSending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Announcement
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Announcement History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No announcements sent yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Sent By</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.data.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="font-medium">{announcement.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{announcement.message}</TableCell>
                      <TableCell>{announcement.user.name}</TableCell>
                      <TableCell>{announcement.recipients_count} members</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(announcement.sent_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
