import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChartBar, ImageIcon } from "lucide-react";

// 🧩 Define breadcrumb for layout
const breadcrumbs: BreadcrumbItem[] = [
  { title: "Analytics & Reports", href: "/manager/analytics-reports" },
];

// 🧠 Define the type for event data
interface AttendanceData {
  name: string;
  count: number;
}

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  poster: string;
  attendance: AttendanceData[];
  description: string;
}

export default function AnalyticsReports() {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  // 🗂️ Mock event data
  const events: EventData[] = [
    {
      id: 1,
      title: "Community Clean-Up Drive",
      date: "Oct 12, 2024",
      location: "City Park",
      poster: "placeholder",
      attendance: [
        { name: "Volunteers", count: 120 },
        { name: "Guests", count: 20 },
      ],
      description:
        "A community-driven clean-up initiative that successfully gathered volunteers to collect over 300kg of waste.",
    },
    {
      id: 2,
      title: "Food Donation Week",
      date: "Nov 15–20, 2024",
      location: "Downtown Hall",
      poster: "placeholder",
      attendance: [
        { name: "Donors", count: 85 },
        { name: "Receivers", count: 60 },
      ],
      description:
        "Annual food redistribution event helping low-income families through organized donations and volunteer logistics.",
    },
    {
      id: 3,
      title: "STEM Education Fair",
      date: "Jan 10, 2025",
      location: "Science Building",
      poster: "placeholder",
      attendance: [
        { name: "Students", count: 150 },
        { name: "Visitors", count: 40 },
      ],
      description:
        "An exhibition of student innovation in science and technology featuring interactive displays and workshops.",
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Analytics & Reports" />

      <div className="flex flex-col gap-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChartBar className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Analytics & Reports</h1>
          </div>
        </div>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>Past Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Poster</TableHead>
                  <TableHead>Event Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="h-16 w-20 bg-muted flex items-center justify-center rounded-md">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedEvent(event)}
                      >
                        View Analytics
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Analytics Modal */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {selectedEvent?.title} — Event Analytics
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-6">
              {/* Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedEvent?.attendance ?? []}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {selectedEvent?.description}
              </p>

              {/* Placeholder Images */}
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-video bg-muted rounded-md flex items-center justify-center"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                ))}
              </div>

              <CardFooter className="justify-end">
                <Button
                  onClick={() => alert("Report generated successfully!")}
                >
                  Generate Report
                </Button>
              </CardFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
