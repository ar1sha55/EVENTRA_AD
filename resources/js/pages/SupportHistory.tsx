import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, MessageSquare, Clock, CheckCircle2, AlertCircle, User, RefreshCw, Inbox } from "lucide-react";
import type { BreadcrumbItem } from "@/types";
import { TicketCardsListSkeleton } from "@/components/ui/loading-skeletons";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "My Tickets", href: "/support-history" },
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

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'resolved';

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'in_progress': return 'In Progress';
    case 'resolved': return 'Resolved';
    default: return status;
  }
};

export default function SupportHistory({ tickets }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Track page loading state
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

  // Calculate statistics
  const statistics = useMemo(() => {
    return {
      total: tickets.data.length,
      pending: tickets.data.filter(t => t.status === 'pending').length,
      in_progress: tickets.data.filter(t => t.status === 'in_progress').length,
      resolved: tickets.data.filter(t => t.status === 'resolved').length,
    };
  }, [tickets.data]);

  // Filter tickets based on status
  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return tickets.data;
    return tickets.data.filter(t => t.status === statusFilter);
  }, [tickets.data, statusFilter]);

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

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-l-yellow-500';
      case 'in_progress':
        return 'border-l-blue-500';
      case 'resolved':
        return 'border-l-green-500';
      default:
        return 'border-l-purple-500';
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
      <Head title="My Tickets" />
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Tickets</h1>
              <p className="text-muted-foreground">
                View all your submitted support tickets and their status
              </p>
            </div>
          </div>
          <Button onClick={() => router.visit('/contact-support')} className="bg-orange-600 hover:bg-orange-700">
            <MessageSquare className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Status Filter Buttons */}
        {tickets.data.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All ({statistics.total})
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                  className={statusFilter === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Pending ({statistics.pending})
                </Button>
                <Button
                  variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('in_progress')}
                  className={statusFilter === 'in_progress' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  In Progress ({statistics.in_progress})
                </Button>
                <Button
                  variant={statusFilter === 'resolved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('resolved')}
                  className={statusFilter === 'resolved' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Resolved ({statistics.resolved})
                </Button>
              </div>

              {/* Active Filter Indicator */}
              {statusFilter !== 'all' && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Showing:</span>
                  <Badge variant="secondary" className="gap-1">
                    {getStatusLabel(statusFilter)} tickets
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="ml-1 hover:text-foreground"
                    >
                      ×
                    </button>
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isPageLoading ? (
          <TicketCardsListSkeleton count={3} />
        ) : tickets.data.length === 0 ? (
          /* Empty State - No Tickets Ever */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Inbox className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Tickets Yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You haven't submitted any support tickets. Need help with something? Our support team is here for you!
              </p>
              <Button
                onClick={() => router.visit('/contact-support')}
                className="bg-orange-600 hover:bg-orange-700 gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Submit Your First Ticket
              </Button>
            </CardContent>
          </Card>
        ) : filteredTickets.length === 0 ? (
          /* Empty State - No Tickets for Current Filter */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <History className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No {getStatusLabel(statusFilter)} Tickets</h3>
              <p className="text-muted-foreground text-center mb-4">
                You don't have any tickets with "{getStatusLabel(statusFilter)}" status.
              </p>
              <Button
                variant="outline"
                onClick={() => setStatusFilter('all')}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                View All Tickets
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                className={`hover:shadow-xl transition-all duration-300 border-l-4 ${getBorderColor(ticket.status)} hover:scale-[1.01]`}
              >
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
    </AppLayout>
  );
}
