import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LifeBuoy,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  MessageSquare,
  Calendar,
  Tag,
  AlertTriangle
} from "lucide-react";
import type { BreadcrumbItem } from "@/types";
import { useState, useMemo } from "react";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Support Tickets", href: "/admin/support-tickets" },
];

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'in_progress': return 'In Progress';
    case 'resolved': return 'Resolved';
    default: return status;
  }
};

interface SupportTicket {
  id: number;
  subject: string;
  message: string;
  category: 'general' | 'technical' | 'account' | 'event' | 'payment' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved';
  user: { id: number; name: string; email: string };
  admin_response: string | null;
  responded_by: { id: number; name: string } | null;
  created_at: string;
}

interface Stats {
  pending: number;
  in_progress: number;
  resolved: number;
  total: number;
}

interface Props {
  tickets: {
    data: SupportTicket[];
    links: any[];
    current_page: number;
    last_page: number;
  };
  stats: Stats;
  currentStatus: string;
}

export default function SupportTickets({ tickets, stats, currentStatus }: Props) {
  // Local state for filtering
  const [activeTab, setActiveTab] = useState<string>(currentStatus || 'all');

  // Filter tickets based on active tab
  const filteredTickets = useMemo(() => {
    if (activeTab === 'all') {
      return tickets.data;
    }
    return tickets.data.filter(ticket => ticket.status === activeTab);
  }, [tickets.data, activeTab]);

  // Calculate stats dynamically
  const calculatedStats = useMemo(() => {
    return {
      pending: tickets.data.filter(t => t.status === 'pending').length,
      in_progress: tickets.data.filter(t => t.status === 'in_progress').length,
      resolved: tickets.data.filter(t => t.status === 'resolved').length,
      total: tickets.data.length,
    };
  }, [tickets.data]);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'General',
      technical: 'Technical',
      account: 'Account',
      event: 'Event',
      payment: 'Payment',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleViewTicket = (ticketId: number) => {
    router.visit(`/admin/support-tickets/${ticketId}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Support Tickets Management" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LifeBuoy className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground">
              Manage and respond to user support tickets
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{calculatedStats.pending}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Awaiting response
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{calculatedStats.in_progress}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Being handled
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold">{calculatedStats.resolved}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully closed
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                  <p className="text-2xl font-bold">{calculatedStats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All submissions
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({calculatedStats.total})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({calculatedStats.pending})</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress ({calculatedStats.in_progress})</TabsTrigger>
                <TabsTrigger value="resolved">Resolved ({calculatedStats.resolved})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <LifeBuoy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">No tickets found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-start gap-4 p-5 border rounded-xl bg-card cursor-pointer transition-all duration-200 hover:border-purple-300 hover:shadow-md hover:bg-purple-50/30 dark:hover:bg-purple-950/10"
                        onClick={() => handleViewTicket(ticket.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className={getStatusColor(ticket.status)}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                              {ticket.priority === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {getPriorityLabel(ticket.priority)}
                            </Badge>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              <Tag className="h-3 w-3 mr-1" />
                              {getCategoryLabel(ticket.category)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              #{ticket.id}
                            </span>
                          </div>
                          <h3 className="font-semibold mb-1">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {ticket.message}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{ticket.user.name}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(ticket.created_at)}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details →
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

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
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
