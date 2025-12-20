import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  History,
  Search,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  User as UserIcon,
  Activity as ActivityIcon,
  Database,
  LogIn,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Types
interface User {
  id: number;
  name: string;
  email: string;
}

interface ActivityLog {
  id: number;
  user_id: number | null;
  user: User | null;
  action: string;
  resource_type: string | null;
  resource_id: number | null;
  description: string;
  old_values: any;
  new_values: any;
  properties: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface PaginatedLogs {
  data: ActivityLog[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
  links: any[];
}

interface Props {
  logs: PaginatedLogs;
  actionTypes: string[];
  users: User[];
  filters: {
    search?: string;
    from_date?: string;
    to_date?: string;
    action_filter?: string;
    user_id?: string;
    resource_type?: string;
  };
}

export default function ActivityLogs({ logs, actionTypes, users, filters }: Props) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [fromDate, setFromDate] = useState(filters.from_date || '');
  const [toDate, setToDate] = useState(filters.to_date || '');
  const [actionFilter, setActionFilter] = useState(filters.action_filter || '');
  const [userFilter, setUserFilter] = useState(filters.user_id || '');
  const [activeTab, setActiveTab] = useState('all');
  const [viewingLog, setViewingLog] = useState<ActivityLog | null>(null);

  const breadcrumbs = [
    { label: 'System Control', href: '/admin/system-control' },
    { label: 'Activity Logs', href: '/admin/activity-logs' },
  ];

  // Apply filters
  const handleFilter = () => {
    router.get('/admin/activity-logs', {
      search: searchQuery,
      from_date: fromDate,
      to_date: toDate,
      action_filter: actionFilter === 'all' ? '' : actionFilter,
      user_id: userFilter === 'all' ? '' : userFilter,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Reset filters
  const handleReset = () => {
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setActionFilter('');
    setUserFilter('');
    router.get('/admin/activity-logs');
  };

  // Export to CSV
  const handleExport = () => {
    const params = new URLSearchParams({
      search: searchQuery,
      from_date: fromDate,
      to_date: toDate,
      action_filter: actionFilter === 'all' ? '' : actionFilter,
      user_id: userFilter === 'all' ? '' : userFilter,
    });
    window.location.href = `/admin/activity-logs/export?${params}`;
  };

  // Format action to user-friendly text
  const formatAction = (action: string) => {
    const [category, actionType] = action.split('.');

    // Convert snake_case to Title Case
    const formatText = (text: string) => {
      return text
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return formatText(actionType || category);
  };

  // Get action badge styling and icon
  const getActionDetails = (action: string) => {
    const [category] = action.split('.');

    const configs: Record<string, any> = {
      user: {
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300',
        icon: UserIcon
      },
      event: {
        className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900 dark:hover:text-purple-300',
        icon: Calendar
      },
      registration: {
        className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900 dark:hover:text-green-300',
        icon: Database
      },
      auth: {
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900 dark:hover:text-orange-300',
        icon: LogIn
      },
    };

    return configs[category] || {
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300',
      icon: ActivityIcon
    };
  };

  // Filter logs by active tab
  const filteredLogs = useMemo(() => {
    if (activeTab === 'all') return logs.data;

    return logs.data.filter(log => {
      const [category] = log.action.split('.');
      return category === activeTab;
    });
  }, [logs.data, activeTab]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Activity Logs" />

      <div className="flex flex-col gap-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-semibold">Activity Logs</h1>
              <p className="text-sm text-muted-foreground">
                View and track all system activities
              </p>
            </div>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter activity logs by date, action, or user</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Controls */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search description, action, user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                  className="pl-10"
                />
              </div>

              {/* Date From */}
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="From date"
              />

              {/* Date To */}
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="To date"
              />

              {/* Action Type Filter */}
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* User Filter */}
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Apply and Reset Buttons */}
              <div className="flex gap-2 md:col-span-2">
                <Button
                  onClick={handleFilter}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-700 dark:hover:bg-orange-800"
                >
                  Apply Filters
                </Button>
                <Button onClick={handleReset} variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex space-x-1 rounded-xl bg-muted p-1 w-fit">
          {['all', 'user', 'event', 'registration', 'auth'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 rounded-lg py-2.5 text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Activity Logs Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead className="max-w-md">Description</TableHead>
                  <TableHead className="text-center w-[80px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No activity logs found</h3>
                      <p className="text-muted-foreground mt-1">
                        Try adjusting your filters or search query.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const actionDetails = getActionDetails(log.action);
                    const ActionIcon = actionDetails.icon;

                    return (
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {log.user ? log.user.name : 'System'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`gap-1 ${actionDetails.className}`}>
                            <ActionIcon className="h-3 w-3" />
                            {formatAction(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.resource_type ? (
                            <span>
                              {log.resource_type}
                              {log.resource_id && ` #${log.resource_id}`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md truncate text-sm">
                          {log.description}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingLog(log)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination Info */}
        {logs.total > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {logs.from || 0} to {logs.to || 0} of {logs.total} entries
          </div>
        )}

        {/* Pagination Links */}
        {logs.last_page > 1 && (
          <div className="flex justify-center gap-2">
            {logs.links.map((link, index) => (
              <Button
                key={index}
                variant={link.active ? 'default' : 'outline'}
                size="sm"
                disabled={!link.url}
                onClick={() => link.url && router.get(link.url)}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewingLog && (
        <LogDetailsModal
          log={viewingLog}
          onClose={() => setViewingLog(null)}
        />
      )}
    </AppLayout>
  );
}

// Log Details Modal Component
function LogDetailsModal({ log, onClose }: { log: ActivityLog; onClose: () => void }) {
  return (
    <Dialog open={!!log} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Activity Log Details</DialogTitle>
          <DialogDescription>
            Full information about this activity
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID</p>
              <p className="text-sm font-mono">#{log.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
              <p className="text-sm">{new Date(log.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User</p>
              <p className="text-sm">{log.user ? log.user.name : 'System'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Action</p>
              <p className="text-sm font-mono">{log.action}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resource</p>
              <p className="text-sm">
                {log.resource_type ? `${log.resource_type} #${log.resource_id}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">IP Address</p>
              <p className="text-sm font-mono">{log.ip_address || '-'}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
            <p className="text-sm p-3 bg-muted rounded-md">{log.description}</p>
          </div>

          {/* Old Values */}
          {log.old_values && Object.keys(log.old_values).length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Old Values</p>
              <pre className="text-xs p-3 bg-muted rounded-md overflow-auto">
                {JSON.stringify(log.old_values, null, 2)}
              </pre>
            </div>
          )}

          {/* New Values */}
          {log.new_values && Object.keys(log.new_values).length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">New Values</p>
              <pre className="text-xs p-3 bg-muted rounded-md overflow-auto">
                {JSON.stringify(log.new_values, null, 2)}
              </pre>
            </div>
          )}

          {/* Properties */}
          {log.properties && Object.keys(log.properties).length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Additional Properties</p>
              <pre className="text-xs p-3 bg-muted rounded-md overflow-auto">
                {JSON.stringify(log.properties, null, 2)}
              </pre>
            </div>
          )}

          {/* User Agent */}
          {log.user_agent && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">User Agent</p>
              <p className="text-xs p-3 bg-muted rounded-md font-mono break-all">
                {log.user_agent}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
