import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search,
  Eye,
  RefreshCw,
  User as UserIcon,
  Database,
  Clock,
  ShieldCheck,
  Copy,
  PlusCircle,
  AlertCircle,
  Layers,
  Monitor,
  CalendarDays,
  Terminal,
  History,
  X,
  LogIn,
  LogOut,
  Trash2,
  Edit,
  UserPlus,
  Mail,
  Settings,
  FileText,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Props {
  logs: any;
  actionTypes: string[];
  users: any[];
  filters: any;
}

export default function AuditTrail({ logs, actionTypes, users, filters }: Props) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [fromDate, setFromDate] = useState(filters.from_date || '');
  const [toDate, setToDate] = useState(filters.to_date || '');
  const [actionFilter, setActionFilter] = useState(filters.action_filter || '');
  const [viewingLog, setViewingLog] = useState<any | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);

  // Calculate statistics
  const statistics = useMemo(() => {
    const actionCounts = {
      create: logs.data.filter((l: any) => l.action?.toLowerCase().includes('create')).length,
      update: logs.data.filter((l: any) => l.action?.toLowerCase().includes('update')).length,
      delete: logs.data.filter((l: any) => l.action?.toLowerCase().includes('delete')).length,
    };
    return {
      total: logs.total,
      activeUsers: users.length,
      resources: new Set(logs.data.map((l: any) => l.resource_type)).size,
      recentLogs: logs.data.length,
      ...actionCounts,
    };
  }, [logs, users]);

  // Debounced filter application
  const applyFilters = useCallback((search: string, from: string, to: string, action: string) => {
    setIsFiltering(true);
    router.get('/admin/audit-trail', {
      search: search || undefined,
      from_date: from || undefined,
      to_date: to || undefined,
      action_filter: action && action !== 'all' ? action : undefined,
    }, {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setIsFiltering(false),
    });
  }, []);

  // Auto-apply filters with debounce for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only apply if values have changed from initial filters
      const searchChanged = searchQuery !== (filters.search || '');
      const fromChanged = fromDate !== (filters.from_date || '');
      const toChanged = toDate !== (filters.to_date || '');
      const actionChanged = actionFilter !== (filters.action_filter || '');

      if (searchChanged || fromChanged || toChanged || actionChanged) {
        applyFilters(searchQuery, fromDate, toDate, actionFilter);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fromDate, toDate, actionFilter]);

  const handleResetFilter = () => {
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setActionFilter('');
    router.get('/admin/audit-trail');
  };

  const clearDateRange = () => {
    setFromDate('');
    setToDate('');
  };

  const setQuickDate = (days: number) => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - days);
    setFromDate(format(from, 'yyyy-MM-dd'));
    setToDate(format(today, 'yyyy-MM-dd'));
  };

  const hasActiveFilters = searchQuery || fromDate || toDate || (actionFilter && actionFilter !== 'all');

  // Format action for display - show actual activity name
  const formatActionName = (action: string) => {
    if (!action) return 'System Action';

    // Convert various formats to readable format:
    // - dot notation: event.statuschanged -> Event Status Changed
    // - snake_case: create_event -> Create Event
    // - camelCase: createEvent -> Create Event
    return action
      .replace(/\./g, ' ')           // Replace dots with spaces
      .replace(/_/g, ' ')            // Replace underscores with spaces
      .replace(/([a-z])([A-Z])/g, '$1 $2')  // Add space before capitals in camelCase
      .replace(/([a-zA-Z])(\d)/g, '$1 $2')  // Add space before numbers
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get icon and color based on action type
  const getActionConfig = (action: string) => {
    const act = action?.toLowerCase() || '';

    // Login/Logout actions
    if (act.includes('login') || act.includes('logged_in')) {
      return { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: LogIn };
    }
    if (act.includes('logout') || act.includes('logged_out')) {
      return { color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-900/30', icon: LogOut };
    }

    // User actions
    if (act.includes('user') && act.includes('create')) {
      return { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: UserPlus };
    }

    // Event actions
    if (act.includes('event')) {
      if (act.includes('create')) {
        return { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: Calendar };
      }
      if (act.includes('delete')) {
        return { color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', icon: Trash2 };
      }
      if (act.includes('update')) {
        return { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: Edit };
      }
      return { color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: Calendar };
    }

    // Announcement/Email actions
    if (act.includes('announcement') || act.includes('email') || act.includes('blast')) {
      return { color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30', icon: Mail };
    }

    // Settings/Profile actions
    if (act.includes('setting') || act.includes('profile') || act.includes('password')) {
      return { color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30', icon: Settings };
    }

    // Generic CRUD actions
    if (act.includes('create')) {
      return { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: PlusCircle };
    }
    if (act.includes('delete')) {
      return { color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', icon: Trash2 };
    }
    if (act.includes('update') || act.includes('edit')) {
      return { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: Edit };
    }

    // Default
    return { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: FileText };
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Audit Trail', href: '/admin/audit-trail' }]}>
      <Head title="Audit Trail" />

      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <History className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Audit Trail</h1>
            <p className="text-muted-foreground">
              Detailed tracking of every administrative action
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-bold">{statistics.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All records
                  </p>
                </div>
                <Layers className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{statistics.activeUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    With logged actions
                  </p>
                </div>
                <UserIcon className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resources</p>
                  <p className="text-2xl font-bold">{statistics.resources}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Resource types
                  </p>
                </div>
                <Database className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recent Logs</p>
                  <p className="text-2xl font-bold">{statistics.recentLogs}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    On this page
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Audit Trail ({logs.total})
                    {isFiltering && (
                      <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    {hasActiveFilters
                      ? `Showing ${logs.data.length} filtered results`
                      : 'View and track all system activities'}
                  </CardDescription>
                </div>
              </div>

              {/* Filters */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by keywords or description..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Action Type Filter */}
                    <div className="w-full lg:w-48">
                      <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Actions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Actions</SelectItem>
                          {actionTypes.map(type => (
                            <SelectItem key={type} value={type} className="capitalize">
                              {formatActionName(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Date Range:</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        <div className="space-y-1">
                          <Label htmlFor="fromDate" className="text-xs text-muted-foreground">From</Label>
                          <Input
                            id="fromDate"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full sm:w-44"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="toDate" className="text-xs text-muted-foreground">To</Label>
                          <Input
                            id="toDate"
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full sm:w-44"
                          />
                        </div>
                        {(fromDate || toDate) && (
                          <div className="flex items-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearDateRange}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Clear dates
                            </Button>
                          </div>
                        )}
                      </div>
                      {/* Quick date presets */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const today = new Date();
                            setFromDate(format(today, 'yyyy-MM-dd'));
                            setToDate(format(today, 'yyyy-MM-dd'));
                          }}
                        >
                          Today
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickDate(7)}
                        >
                          Last 7 days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickDate(30)}
                        >
                          Last 30 days
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {hasActiveFilters && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t flex-wrap">
                      <span className="text-sm text-muted-foreground">Active filters:</span>
                      {searchQuery && (
                        <Badge variant="secondary" className="gap-1">
                          Search: "{searchQuery}"
                          <button
                            onClick={() => setSearchQuery('')}
                            className="ml-1 hover:text-foreground"
                          >
                            ×
                          </button>
                        </Badge>
                      )}
                      {actionFilter && actionFilter !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          Action: {formatActionName(actionFilter)}
                          <button
                            onClick={() => setActionFilter('')}
                            className="ml-1 hover:text-foreground"
                          >
                            ×
                          </button>
                        </Badge>
                      )}
                      {fromDate && (
                        <Badge variant="secondary" className="gap-1">
                          From: {fromDate}
                          <button
                            onClick={() => setFromDate('')}
                            className="ml-1 hover:text-foreground"
                          >
                            ×
                          </button>
                        </Badge>
                      )}
                      {toDate && (
                        <Badge variant="secondary" className="gap-1">
                          To: {toDate}
                          <button
                            onClick={() => setToDate('')}
                            className="ml-1 hover:text-foreground"
                          >
                            ×
                          </button>
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilter}
                        className="h-6 text-xs"
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardHeader>
          <CardContent>
            {logs.data.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {hasActiveFilters ? 'No records match your filters' : 'No audit trail yet'}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {hasActiveFilters ? 'Try adjusting your search or filters.' : 'System activities will be recorded here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                      <th className="px-4 py-3 text-left font-semibold">Actor</th>
                      <th className="px-4 py-3 text-left font-semibold">Activity</th>
                      <th className="px-4 py-3 text-left font-semibold">Resource</th>
                      <th className="px-4 py-3 text-center font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.data.map((log: any) => {
                      const config = getActionConfig(log.action);
                      const ActionIcon = config.icon;
                      return (
                        <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                              <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'MMM d, yyyy • HH:mm')}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-medium text-xs">
                                {log.user?.name?.substring(0, 1) || 'S'}
                              </div>
                              <span className="font-medium">{log.user?.name || 'System'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg}`}>
                              <ActionIcon className={`h-4 w-4 ${config.color}`} />
                              <span className={`text-sm font-medium ${config.color}`}>
                                {formatActionName(log.action)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {log.resource_type || 'Internal'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingLog(log)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {logs.data.length > 0 && (
          <div className="flex items-center justify-between px-2">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{logs.from}-{logs.to}</span> of <span className="font-medium">{logs.total}</span> entries
            </p>
            <div className="flex gap-1">
              {logs.links.map((link: any, i: number) => (
                <Button
                  key={i}
                  variant={link.active ? 'default' : 'outline'}
                  size="sm"
                  className={link.active ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  disabled={!link.url}
                  onClick={() => link.url && router.get(link.url)}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal - Inspection View */}
      <Dialog open={!!viewingLog} onOpenChange={() => setViewingLog(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">ID: {viewingLog?.id}</Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs font-mono text-muted-foreground">{viewingLog?.ip_address || '127.0.0.1'}</span>
            </div>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Audit Inspector
            </DialogTitle>
            <DialogDescription>
              Viewing full state transformation for resource: {viewingLog?.resource_type}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Activity Info */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Activity</Label>
              <div className="flex items-center gap-2">
                {viewingLog && (() => {
                  const config = getActionConfig(viewingLog.action);
                  const ActionIcon = config.icon;
                  return (
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg}`}>
                      <ActionIcon className={`h-4 w-4 ${config.color}`} />
                      <span className={`text-sm font-medium ${config.color}`}>
                        {formatActionName(viewingLog.action)}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Monitor className="h-4 w-4" /> Description
              </Label>
              <div className="bg-muted rounded-lg p-4 text-sm">
                {viewingLog?.description}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">State Change Preview</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-center text-muted-foreground">Previous State</p>
                  <pre className="p-3 bg-muted rounded-lg text-xs font-mono h-40 overflow-auto">
                    {JSON.stringify(viewingLog?.old_values, null, 2) || "// No previous data"}
                  </pre>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-center text-orange-600 font-medium">New State</p>
                  <pre className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-xs font-mono h-40 overflow-auto border border-orange-200 dark:border-orange-800">
                    {JSON.stringify(viewingLog?.new_values, null, 2) || "// No new data"}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(viewingLog, null, 2));
                alert('Copied to clipboard');
              }}
              className="gap-2"
            >
              <Copy className="h-4 w-4" /> Copy Raw Metadata
            </Button>
            <Button onClick={() => setViewingLog(null)} className="bg-orange-600 hover:bg-orange-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
