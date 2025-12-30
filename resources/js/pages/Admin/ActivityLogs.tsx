import React, { useState } from 'react';
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
  Copy,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRightLeft
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

// --- Types ---
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
  };
}

// --- Sub-Components ---

function DiffViewer({ oldData, newData }: { oldData: any; newData: any }) {
  const allKeys = Array.from(new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]));
  
  if (allKeys.length === 0) return <div className="text-sm text-muted-foreground italic p-8 text-center bg-orange-50/20 rounded-xl border border-dashed">No structural data changes recorded for this event.</div>;

  return (
    <div className="rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-orange-50/50 dark:bg-orange-900/10 text-[10px] uppercase tracking-widest font-bold">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 text-orange-800 dark:text-orange-300">Attribute</TableHead>
            <TableHead className="h-10 text-slate-500">Previous State</TableHead>
            <TableHead className="h-10 text-orange-600">New State</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allKeys.map((key) => {
            const isDifferent = JSON.stringify(oldData?.[key]) !== JSON.stringify(newData?.[key]);
            return (
              <TableRow key={key} className={`${isDifferent ? "bg-orange-50/30 dark:bg-orange-900/5" : ""} border-b last:border-0`}>
                <TableCell className="font-mono text-[11px] py-3 font-semibold text-slate-500">{key}</TableCell>
                <TableCell className="text-xs py-3 text-slate-400 font-normal">
                  {oldData && oldData[key] !== undefined ? String(oldData[key]) : <span className="opacity-20">-</span>}
                </TableCell>
                <TableCell className={`text-xs py-3 font-medium ${isDifferent ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600'}`}>
                  {newData && newData[key] !== undefined ? String(newData[key]) : <span className="opacity-20">-</span>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// --- Main Component ---

export default function ActivityLogs({ logs, actionTypes, users, filters }: Props) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [fromDate, setFromDate] = useState(filters.from_date || '');
  const [toDate, setToDate] = useState(filters.to_date || '');
  const [actionFilter, setActionFilter] = useState(filters.action_filter || '');
  const [userFilter, setUserFilter] = useState(filters.user_id || '');
  const [viewingLog, setViewingLog] = useState<ActivityLog | null>(null);

  const breadcrumbs = [
    { label: 'System Control', href: '/admin/system-control' },
    { label: 'Activity Logs', href: '/admin/activity-logs' },
  ];

  const applyFilters = () => {
    router.get('/admin/activity-logs', {
      search: searchQuery,
      from_date: fromDate,
      to_date: toDate,
      action_filter: actionFilter === 'all' ? '' : actionFilter,
      user_id: userFilter === 'all' ? '' : userFilter,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleReset = () => {
    setSearchQuery(''); setFromDate(''); setToDate(''); setActionFilter(''); setUserFilter('');
    router.get('/admin/activity-logs');
  };

  const getActionTheme = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create')) return { border: 'border-l-orange-500', bg: 'bg-orange-100/50 text-orange-700' };
    if (act.includes('delete')) return { border: 'border-l-red-500', bg: 'bg-red-50 text-red-700' };
    if (act.includes('update')) return { border: 'border-l-amber-500', bg: 'bg-amber-50 text-amber-700' };
    return { border: 'border-l-slate-400', bg: 'bg-slate-100 text-slate-700' };
  };

  const quickStats = [
    { label: 'Total Logs', value: logs.total, icon: History, bg: 'bg-[#FFF7ED]', border: 'border-orange-100', iconBg: 'bg-orange-500', iconColor: 'text-white' },
    { label: 'Recent', value: logs.data.length, icon: Clock, bg: 'bg-[#FFFBEB]', border: 'border-amber-100', iconBg: 'bg-amber-500', iconColor: 'text-white' },
    { label: 'Resources', value: new Set(logs.data.map(l => l.resource_type)).size - 1, icon: Database, bg: 'bg-[#FEFCE8]', border: 'border-yellow-100', iconBg: 'bg-yellow-500', iconColor: 'text-white' },
    { label: 'Users', value: users.length, icon: UserIcon, bg: 'bg-[#F0FDF4]', border: 'border-green-100', iconBg: 'bg-green-500', iconColor: 'text-white' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Activity Logs" />

      <div className="flex flex-col gap-6 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <div className="h-10 w-2 bg-orange-500 rounded-full" />
              Activity Logs
            </h1>
            <p className="text-slate-500 font-medium ml-5 italic">Tracking platform evolution and security events.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button onClick={handleReset} variant="outline" size="sm" className="rounded-xl border-slate-200">
              <RefreshCw className="h-4 w-4 mr-2 text-orange-500" /> Reset View
            </Button>
            <Button onClick={() => window.print()} className="bg-orange-600 hover:bg-orange-700 rounded-xl shadow-lg shadow-orange-200">
              <Download className="h-4 w-4 mr-2" /> Export Audit
            </Button>
          </div>
        </div>

        {/* Pastel Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, i) => (
            <Card key={i} className={`${stat.bg} ${stat.border} border shadow-sm transition-all hover:scale-[1.03] rounded-3xl overflow-hidden group`}>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-2xl ${stat.iconBg} ${stat.iconColor} shadow-xl shadow-inner group-hover:rotate-12 transition-transform`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Card */}
        <Card className="shadow-xl shadow-orange-100/50 border-orange-100/60 bg-white/80 backdrop-blur rounded-[2rem] border-2">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-4 space-y-3">
                <label className="text-xs font-black uppercase text-orange-600 flex items-center gap-2 tracking-widest ml-1">
                  <Search className="h-3 w-3" /> Search Keywords
                </label>
                <Input 
                  placeholder="Describe what you're looking for..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="rounded-2xl h-12 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-all"
                />
              </div>

              <div className="lg:col-span-3 space-y-3">
                <label className="text-xs font-black uppercase text-orange-600 tracking-widest ml-1">Action Category</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none capitalize">
                    <SelectValue placeholder="Filter Actions" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Actions</SelectItem>
                    {actionTypes.map(type => (
                      <SelectItem key={type} value={type} className="capitalize">{type.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-3 space-y-3">
                <label className="text-xs font-black uppercase text-orange-600 tracking-widest ml-1">Timeline</label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-1 px-3 h-12">
                   <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-transparent border-none text-xs focus-visible:ring-0" />
                   <div className="h-4 w-[1px] bg-slate-200" />
                   <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-transparent border-none text-xs focus-visible:ring-0" />
                </div>
              </div>

              <div className="lg:col-span-2">
                <Button onClick={applyFilters} className="w-full h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-200 uppercase tracking-widest text-xs">
                  Update
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Content */}
        <Card className="border-slate-100 shadow-2xl shadow-slate-200 rounded-[2rem] overflow-hidden border">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] text-[10px] uppercase font-black text-slate-400 tracking-widest pl-8">When</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Actor</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Activity</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Resource</TableHead>
                <TableHead className="hidden md:table-cell text-[10px] uppercase font-black text-slate-400 tracking-widest">Memo</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-black text-slate-400 tracking-widest pr-8">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.data.map((log) => {
                const theme = getActionTheme(log.action);
                return (
                  <TableRow key={log.id} className={`group border-l-[6px] transition-all ${theme.border} hover:bg-orange-50/20`}>
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                        <span className="text-[10px] text-slate-400 font-mono italic">{format(new Date(log.created_at), 'MMM d, HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black border border-orange-200 shadow-sm uppercase">
                          {log.user ? log.user.name.substring(0,2) : 'SY'}
                        </div>
                        <span className="text-sm font-bold text-slate-600">{log.user?.name || 'System'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-black text-[9px] border-none px-3 py-1 rounded-lg tracking-[0.05em] uppercase ${theme.bg}`}>
                        {log.action.split('.').pop()?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{log.resource_type || 'Internal'}</span>
                        {log.resource_id && <span className="text-[10px] font-mono text-orange-400 opacity-60">ID: {log.resource_id}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[250px] truncate text-xs text-slate-500 italic">
                      {log.description}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl hover:bg-white hover:shadow-md hover:text-orange-500 transition-all border border-transparent"
                        onClick={() => setViewingLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Entry {logs.from} — {logs.to} of {logs.total}</span>
           <div className="flex items-center gap-2">
              {logs.links.map((link, i) => (
                <Button
                  key={i}
                  variant={link.active ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 min-w-[32px] rounded-lg text-[10px] font-bold ${link.active ? 'bg-orange-600 border-orange-600' : 'border-slate-200 text-slate-500'}`}
                  disabled={!link.url}
                  onClick={() => link.url && router.get(link.url)}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
           </div>
        </div>
      </div>

      {/* Modern Detail Dialog */}
      {viewingLog && (
        <Dialog open={!!viewingLog} onOpenChange={() => setViewingLog(null)}>
          <DialogContent className="sm:max-w-[800px] p-0 gap-0 overflow-hidden border-none shadow-3xl rounded-[2.5rem]">
            <DialogHeader className="p-10 bg-orange-50/50 border-b border-orange-100">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-white rounded-3xl shadow-xl shadow-orange-100 border border-orange-100">
                  <ActivityIcon className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-800">Audit Inspector</DialogTitle>
                  <DialogDescription className="font-mono text-xs text-orange-500 font-bold tracking-widest mt-1">LOG_UID: {viewingLog.id}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto">
              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: 'Origin IP', val: viewingLog.ip_address || '127.0.0.1', icon: Zap },
                  { label: 'Object Type', val: viewingLog.resource_type || 'Platform', icon: Database },
                  { label: 'Action Tag', val: viewingLog.action, icon: ShieldCheck, color: 'text-orange-600' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <label className="text-[9px] uppercase text-slate-400 font-black block tracking-widest flex items-center gap-2">
                      <item.icon className="h-3 w-3" /> {item.label}
                    </label>
                    <code className={`text-xs font-black truncate block ${item.color || 'text-slate-600'}`}>{item.val}</code>
                  </div>
                ))}
              </div>

              {/* Memo Section */}
              <div className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-[0.2em] text-orange-600 ml-1">Memo Summary</h4>
                 <div className="text-sm font-medium leading-relaxed text-slate-600 bg-orange-50/30 border border-orange-100 p-6 rounded-[2rem] italic relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><History className="h-20 w-20" /></div>
                    "{viewingLog.description}"
                 </div>
              </div>

              {/* Diff Viewer Component */}
              <div className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-[0.2em] text-orange-600 ml-1 flex items-center justify-between">
                    State Transformation
                    <ArrowRightLeft className="h-4 w-4" />
                 </h4>
                 <DiffViewer oldData={viewingLog.old_values} newData={viewingLog.new_values} />
              </div>

              {/* Technical Data */}
              {viewingLog.user_agent && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-orange-600 ml-1">Environment Signature</h4>
                  <div className="p-5 bg-slate-900 rounded-2xl text-[10px] font-mono text-slate-400 break-all leading-loose border border-slate-800">
                    {viewingLog.user_agent}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-between">
               <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-xl gap-2 text-slate-400 hover:text-orange-600 font-bold"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(viewingLog, null, 2));
                  alert('Metadata copied to clipboard');
                }}
               >
                 <Copy className="h-4 w-4" /> Copy Raw Meta
               </Button>
               <Button onClick={() => setViewingLog(null)} className="rounded-xl px-10 bg-slate-900 hover:bg-slate-800 font-black h-12 tracking-widest">
                 Dismiss
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}