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
  Calendar
} from "lucide-react";
import type { BreadcrumbItem } from "@/types";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Admin", href: "/admin/dashboard" },
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTabChange = (value: string) => {
    router.visit(`/admin/support-tickets?status=${value}`);
  };

  const handleViewTicket = (ticketId: number) => {
    router.visit(`/admin/support-tickets/${ticketId}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Support Tickets Management" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LifeBuoy className="h-8 w-8 text-purple-600" />
            Support Tickets Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and respond to user support tickets
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="overflow-hidden relative group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold mt-1">{stats.pending}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden relative group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-3xl font-bold mt-1">{stats.in_progress}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden relative group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="text-3xl font-bold mt-1">{stats.resolved}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden relative group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
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
            <Tabs value={currentStatus} onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>

              <TabsContent value={currentStatus}>
                {tickets.data.length === 0 ? (
                  <div className="text-center py-12">
                    <LifeBuoy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">No tickets found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.data.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-start gap-4 p-5 border-2 border-transparent rounded-xl hover:border-purple-200 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent dark:hover:border-purple-800 dark:hover:from-purple-950/20 cursor-pointer transition-all duration-200 hover:shadow-md"
                        onClick={() => handleViewTicket(ticket.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={getStatusColor(ticket.status)}>
                              {getStatusLabel(ticket.status)}
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
