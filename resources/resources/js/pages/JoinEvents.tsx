import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, usePage } from "@inertiajs/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  MapPin,
  Eye,
  ImageIcon,
  CheckCircle,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface EventItem {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
  slots: number;
  joined?: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Join Events", href: "/manager/join-events" },
];

export default function JoinEvents() {
  const page = usePage();
  const props = page.props as any;
  const flash = props.flash || {};

  const [events, setEvents] = useState<EventItem[]>(
    props.events ?? [
      {
        id: 1,
        title: "Community Clean-Up Drive",
        date: "December 10, 2025",
        location: "Taman Desa Park",
        description:
          "Join us for a meaningful environmental effort to clean up public areas and promote community care. Gloves, trash bags, and refreshments will be provided.",
        slots: 25,
      },
      {
        id: 2,
        title: "Charity Run for Education",
        date: "November 20, 2025",
        location: "Putrajaya Botanical Garden",
        description:
          "Participate in our 5km fun run to raise awareness and funds for underprivileged school children. Open to all ages.",
        slots: 40,
      },
      {
        id: 3,
        title: "Food Pack Distribution",
        date: "January 15, 2026",
        location: "Kuala Lumpur Central Market",
        description:
          "Volunteer to help pack and distribute food essentials to low-income families and the homeless community.",
        slots: 30,
      },
    ]
  );

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const handleParticipate = (eventId: number) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? { ...event, joined: true, slots: event.slots - 1 }
          : event
      )
    );
    setSelectedEvent(null);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Join Volunteering Events" />

      <div className="flex flex-col gap-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Join Volunteering Events</h1>
          </div>

          {flash.success && (
            <div className="rounded-md bg-green-50 px-3 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
              {flash.success}
            </div>
          )}
        </div>

        {/* Events Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 rounded-xl"
            >
              {/* 🟦 Placeholder Box */}
              <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center text-gray-500">
                <ImageIcon className="h-8 w-8" />
              </div>

              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {event.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {event.date}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  <MapPin className="inline-block h-4 w-4 mr-1 text-muted-foreground" />
                  {event.location}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.description}
                </p>
              </CardContent>

              <CardFooter className="flex justify-between items-center">
                <span
                  className={`text-xs font-medium ${
                    event.slots > 0
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {event.slots > 0
                    ? `${event.slots} slots left`
                    : "No slots available"}
                </span>

                {event.joined ? (
                  <Button size="sm" disabled variant="outline">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Participated
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* 🔹 Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.date} — {selectedEvent?.location}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Placeholder visual */}
            <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center text-gray-500 rounded-md">
              <ImageIcon className="h-8 w-8" />
            </div>

            <p className="text-sm text-gray-700">
              {selectedEvent?.description}
            </p>

            <p className="text-xs text-gray-500">
              Available slots:{" "}
              <span
                className={`font-medium ${
                  selectedEvent?.slots && selectedEvent.slots > 0
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {selectedEvent?.slots}
              </span>
            </p>
          </div>

          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
            {selectedEvent && !selectedEvent.joined && selectedEvent.slots > 0 && (
              <Button onClick={() => handleParticipate(selectedEvent.id)}>
                Participate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
