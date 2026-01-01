import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search,
  Download,
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
  ArrowRight
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Props {
  logs: any;
  actionTypes: string[];
  users: any[];
  filters: any;
}

export default function ActivityLogs({ logs, actionTypes, users, filters }: Props) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [fromDate, setFromDate] = useState(filters.from_date || '');
  const [toDate, setToDate] = useState(filters.to_date || '');
  const [actionFilter, setActionFilter] = useState(filters.action_filter || '');
  const [viewingLog, setViewingLog] = useState<any | null>(null);

  const applyFilters = () => {
    router.get('/admin/activity-logs', {
      search: searchQuery,
      from_date: fromDate,
      to_date: toDate,
      action_filter: actionFilter === 'all' ? '' : actionFilter,
    }, { preserveState: true, preserveScroll: true });
  };

  const getActionConfig = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create')) return { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: PlusCircle, label: 'Creation' };
    if (act.includes('delete')) return { color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle, label: 'Deletion' };
    if (act.includes('update')) return { color: 'text-amber-600', bg: 'bg-amber-50', icon: RefreshCw, label: 'Update' };
    return { color: 'text-blue-600', bg: 'bg-blue-50', icon: ShieldCheck, label: 'System' };
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'System Audit', href: '/admin/activity-logs' }]}>
      <Head title="Activity Logs" />

      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">System Audit</h1>
            <p className="text-lg text-muted-foreground font-medium">Detailed tracking of every administrative action.</p>
          </div>
          <div className="flex gap-3 pb-1">
            <Button variant="outline" size="lg" className="rounded-xl shadow-sm hover:bg-slate-50" onClick={() => router.get('/admin/activity-logs')}>
              <RefreshCw className="h-4 w-4 mr-2 text-slate-500" /> Reset
            </Button>
            <Button size="lg" className="rounded-xl shadow-lg bg-slate-900 hover:bg-slate-800" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" /> Export Audit
            </Button>
          </div>
        </div>

        {/* Stats Row with Soft Gradients */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Entries', val: logs.total, icon: Layers, color: 'from-blue-500 to-indigo-600' },
            { label: 'Active Users', val: users.length, icon: UserIcon, color: 'from-emerald-500 to-teal-600' },
            { label: 'Resources', val: new Set(logs.data.map((l: any) => l.resource_type)).size, icon: Database, color: 'from-purple-500 to-pink-600' },
            { label: 'Recent Logs', val: logs.data.length, icon: Clock, color: 'from-orange-500 to-amber-600' },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-md overflow-hidden group cursor-default">
              <CardContent className="p-0">
                <div className={`h-1 w-full bg-gradient-to-r ${stat.color}`} />
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-800">{stat.val}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="h-6 w-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Floating Filter Bar */}
        <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-xl rounded-[2rem] p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by keywords or description..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-11 h-12 border-none bg-slate-100/50 rounded-2xl focus-visible:ring-slate-200"
              />
            </div>
            <div className="md:col-span-3">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-12 border-none bg-slate-100/50 rounded-2xl">
                  <SelectValue placeholder="Action Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                  <SelectItem value="all">All Activities</SelectItem>
                  {actionTypes.map(type => (
                    <SelectItem key={type} value={type} className="capitalize font-medium">{type.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 flex items-center gap-2 px-2 bg-slate-100/50 rounded-2xl">
              <CalendarDays className="h-4 w-4 text-slate-400 ml-2" />
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border-none bg-transparent focus-visible:ring-0 text-xs font-bold" />
              <span className="text-slate-300">|</span>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border-none bg-transparent focus-visible:ring-0 text-xs font-bold" />
            </div>
            <div className="md:col-span-2">
              <Button onClick={applyFilters} className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Elegant Table */}
        <Card className="border-slate-200/60 shadow-2xl rounded-[2rem] overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="pl-8 py-5 text-xs font-bold text-slate-500 uppercase">Timestamp</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase">Actor</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase">Action</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase">Resource</TableHead>
                <TableHead className="text-right pr-8 text-xs font-bold text-slate-500 uppercase">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.data.map((log: any) => {
                const config = getActionConfig(log.action);
                return (
                  <TableRow key={log.id} className="group hover:bg-slate-50/80 transition-colors border-slate-100">
                    <TableCell className="pl-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                        <span className="text-[11px] font-medium text-slate-400">{format(new Date(log.created_at), 'MMM d, yyyy • HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 border flex items-center justify-center font-bold text-xs text-slate-600">
                          {log.user?.name?.substring(0, 1) || 'S'}
                        </div>
                        <span className="text-sm font-semibold text-slate-600">{log.user?.name || 'System'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.color}`}>
                        <config.icon className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">{config.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-lg font-mono text-[10px] bg-white px-2">
                        {log.resource_type || 'Internal'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button variant="ghost" size="sm" onClick={() => setViewingLog(log)} className="rounded-xl group-hover:bg-white group-hover:shadow-md transition-all">
                        <Eye className="h-4 w-4 mr-2 text-slate-400" />
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between px-2">
          <p className="text-sm font-medium text-slate-500">
            Audit records <span className="text-slate-900 font-bold">{logs.from}—{logs.to}</span> of <span className="text-slate-900 font-bold">{logs.total}</span>
          </p>
          <div className="flex gap-2">
            {logs.links.map((link: any, i: number) => (
              <Button
                key={i}
                variant={link.active ? 'default' : 'outline'}
                size="sm"
                className={`rounded-xl h-9 min-w-[36px] font-bold ${link.active ? 'bg-slate-900' : 'border-slate-200'}`}
                disabled={!link.url}
                onClick={() => link.url && router.get(link.url)}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal - Inspection View */}
      <Dialog open={!!viewingLog} onOpenChange={() => setViewingLog(null)}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-3xl">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Terminal className="h-24 w-24" />
            </div>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-500/20 text-blue-300 border-none">ID: {viewingLog?.id}</Badge>
                <span className="text-slate-500">•</span>
                <span className="text-xs font-mono text-slate-400">{viewingLog?.ip_address || '127.0.0.1'}</span>
              </div>
              <DialogTitle className="text-3xl font-black">Audit Inspector</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Viewing full state transformation for resource: {viewingLog?.resource_type}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto bg-slate-50/50">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Monitor className="h-4 w-4" /> Description
              </h4>
              <div className="bg-white border rounded-2xl p-6 text-slate-600 font-medium leading-relaxed shadow-sm">
                "{viewingLog?.description}"
              </div>
            </div>

            <div className="space-y-3">
               <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">State Change Preview</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-center uppercase text-slate-400">Previous State</p>
                    <pre className="p-4 bg-slate-100 rounded-2xl text-[10px] font-mono h-40 overflow-auto border italic">
                      {JSON.stringify(viewingLog?.old_values, null, 2) || "// No previous data"}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-center uppercase text-blue-500">New State</p>
                    <pre className="p-4 bg-blue-50/50 rounded-2xl text-[10px] font-mono h-40 overflow-auto border border-blue-100 text-blue-900 font-bold">
                      {JSON.stringify(viewingLog?.new_values, null, 2) || "// No new data"}
                    </pre>
                  </div>
               </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-white border-t flex items-center justify-between sm:justify-between">
            <Button variant="ghost" onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(viewingLog, null, 2));
              alert('Copied to clipboard');
            }} className="rounded-xl font-bold gap-2 text-slate-400 hover:text-blue-600">
              <Copy className="h-4 w-4" /> Copy Raw Metadata
            </Button>
            <Button onClick={() => setViewingLog(null)} className="rounded-xl px-8 bg-slate-900 h-11 font-bold">
              Dismiss Inspector
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}