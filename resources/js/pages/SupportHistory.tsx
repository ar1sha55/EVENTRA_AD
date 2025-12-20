import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, MessageSquare, Clock, CheckCircle2, AlertCircle, User } from "lucide-react";
import type { BreadcrumbItem } from "@/types";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Support History", href: "/support-history" },
];

interface SupportTicket {
  id: number;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  admin_response: string | null;
  responded_by: { id: number; name: string } | null;
  responded_at: string | null;
  created_at: string;
}

interface Props {
  tickets: {
    data: SupportTicket[];
    links: any[];
    current_page: number;
    last_page: number;
  };
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'in_progress': return 'In Progress';
    case 'resolved': return 'Resolved';
    default: return status;
  }
};

export default function SupportHistory({ tickets }: Props) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

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

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Support History" />
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg">
                  <History className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">
                  Support Ticket History
                </h1>
              </div>
              <p className="text-muted-foreground mt-1">
                View all your submitted support tickets and their status
              </p>
            </div>
            <Button onClick={() => router.visit('/contact-support')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>

        {tickets.data.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium mb-2">No Tickets Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't submitted any support tickets
              </p>
              <Button onClick={() => router.visit('/contact-support')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit Your First Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.data.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-purple-500 hover:border-purple-600 hover:scale-[1.01]">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getStatusColor(ticket.status)}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{getStatusLabel(ticket.status)}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Ticket #{ticket.id}
                        </span>
                      </div>
                      <CardTitle className="text-xl">{ticket.subject}</CardTitle>
                      <CardDescription>
                        Submitted on {formatDate(ticket.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Your Message:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {ticket.message}
                      </p>
                    </div>

                    {ticket.admin_response && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-l-4 border-blue-500 p-5 rounded-lg shadow-md">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Admin Response
                          </p>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap leading-relaxed">
                          {ticket.admin_response}
                        </p>
                        {ticket.responded_by && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                            <User className="h-4 w-4 text-blue-600" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Responded by <span className="font-semibold">{ticket.responded_by.name}</span> on {formatDate(ticket.responded_at!)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {tickets.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {tickets.links.map((link, index) => (
              <Button
                key={index}
                variant={link.active ? 'default' : 'outline'}
                size="sm"
                disabled={!link.url}
                onClick={() => link.url && router.visit(link.url)}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}
