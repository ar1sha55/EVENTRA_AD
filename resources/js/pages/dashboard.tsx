import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, CalendarDays, Activity, BarChart3 } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
];

export default function Dashboard() {
  // Mock stats
  const stats = {
    totalEvents: 12,
    upcomingEvents: 3,
    totalMembers: 256,
    activeMembers: 198,
  };

  // Upcoming Malaysian volunteering events
  const upcomingEvents = [
    { id: 1, name: "River Clean-Up at Klang", date: "2025-11-15", location: "Klang River, Selangor", type: "Environment" },
    { id: 2, name: "Beach Conservation at Penang", date: "2025-12-05", location: "Batu Ferringhi Beach, Penang", type: "Environment" },
    { id: 3, name: "Community Food Drive at Kuala Lumpur", date: "2026-01-10", location: "KLCC Park", type: "Social" },
  ];

  // Recent activities
  const recentActivities = [
    { id: 1, user: "John Doe", action: "registered for", event: "River Clean-Up at Klang", time: "2 hours ago" },
    { id: 2, user: "Jane Smith", action: "updated their profile", time: "5 hours ago" },
    { id: 3, user: "Mike Johnson", action: "created a new event", event: "Community Food Drive at Kuala Lumpur", time: "1 day ago" },
  ];

  // Past events stats (for chart)
  const pastEventsStats = [
    { name: "Jan", events: 2 },
    { name: "Feb", events: 4 },
    { name: "Mar", events: 3 },
    { name: "Apr", events: 5 },
    { name: "May", events: 4 },
    { name: "Jun", events: 6 },
  ];

  // Top stats configuration
  const topStats = [
    { title: 'Total Events', value: stats.totalEvents, icon: <CalendarDays className="h-4 w-4 text-muted-foreground" />, desc: 'All registered events' },
    { title: 'Upcoming Events', value: stats.upcomingEvents, icon: <CalendarDays className="h-4 w-4 text-muted-foreground" />, desc: 'Next 30 days' },
    { title: 'Total Members', value: stats.totalMembers, icon: <Users className="h-4 w-4 text-muted-foreground" />, desc: 'Registered members' },
    { title: 'Active Members', value: stats.activeMembers, icon: <Activity className="h-4 w-4 text-muted-foreground" />, desc: 'Active this month' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

        {/* Top Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {topStats.map((stat, idx) => (
            <Card key={idx} className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming Events & Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Upcoming Events */}
          <Card className="lg:col-span-2">
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle>Upcoming Events</CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border p-3 transition-all hover:bg-muted/40">
                  <div className="flex flex-col">
                    <span className="font-semibold">{event.name}</span>
                    <span className="text-sm text-muted-foreground">{event.date} - {event.location}</span>
                  </div>
                  <Badge variant="outline">{event.type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{activity.user}</span> {activity.action} {activity.event && <span className="font-semibold">{activity.event}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Past Events Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Past Events Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pastEventsStats}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="events" fill="#f97316" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
