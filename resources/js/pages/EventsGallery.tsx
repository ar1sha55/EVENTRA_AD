import { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, usePage } from "@inertiajs/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Info, ImageIcon, MapPin, Clock } from "lucide-react";
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
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string;
  image_path?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Events Gallery", href: "/manager/events-gallery" },
];

export default function EventsGallery() {
  const page = usePage();
  const props = page.props as any;
  const flash = props.flash || {};

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const events: EventItem[] = props.events ?? [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthYear = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Group events by month
  const groupedEvents = events.reduce((acc: Record<string, EventItem[]>, event) => {
    const monthYear = getMonthYear(event.start_date);
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(event);
    return acc;
  }, {});

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Volunteering Events Gallery" />

      <div className="flex flex-col gap-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">
              Volunteering Events Gallery
            </h1>
          </div>

          {flash.success && (
            <div className="rounded-md bg-green-50 px-3 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
              {flash.success}
            </div>
          )}
        </div>

        {/* Timeline View */}
        {events.length > 0 ? (
          <div className="relative max-w-5xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-blue-500 to-purple-500" />

            <div className="space-y-12">
              {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
                <div key={monthYear} className="relative">
                  {/* Month Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative z-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full shadow-lg">
                      <CalendarDays className="inline h-4 w-4 mr-2" />
                      <span className="font-semibold">{monthYear}</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent dark:from-purple-800" />
                  </div>

                  {/* Events for this month */}
                  <div className="space-y-6">
                    {monthEvents.map((event) => (
                      <div key={event.id} className="relative flex gap-6 group pl-4">
                        {/* Timeline dot */}
                        <div className="absolute left-[27px] top-6">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 ring-4 ring-background shadow-lg z-10 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-white" />
                          </div>
                        </div>

                        {/* Event Card */}
                        <div className="flex-1 ml-12">
                          <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] border-l-4 border-l-purple-500">
                            <div className="grid md:grid-cols-3 gap-0">
                              {/* Event Image */}
                              <div className="md:col-span-1">
                                {event.image_path ? (
                                  <img
                                    src={`/storage/${event.image_path}`}
                                    alt={event.name}
                                    className="aspect-[4/3] md:aspect-auto md:h-full object-cover w-full cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setSelectedEvent(event)}
                                  />
                                ) : (
                                  <div className="aspect-[4/3] md:aspect-auto md:h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                                    <ImageIcon className="h-12 w-12 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Event Details */}
                              <div className="md:col-span-2 p-6">
                                <CardHeader className="p-0 mb-4">
                                  <CardTitle className="text-xl font-bold group-hover:text-purple-600 transition-colors">
                                    {event.name}
                                  </CardTitle>
                                </CardHeader>

                                <CardContent className="p-0 space-y-3">
                                  {/* Date & Time */}
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4 text-purple-500" />
                                    <span className="font-medium">
                                      {new Date(event.start_date).toLocaleDateString('en-MY', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>

                                  {/* Location */}
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4 text-blue-500" />
                                    <span>{event.location}</span>
                                  </div>

                                  {/* Description */}
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
                                    {event.description}
                                  </p>
                                </CardContent>

                                <CardFooter className="p-0 mt-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedEvent(event)}
                                    className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 dark:hover:bg-purple-950"
                                  >
                                    <Info className="mr-2 h-4 w-4" /> View Details
                                  </Button>
                                </CardFooter>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Past Events Yet</p>
              <p className="text-sm mt-2">Past events will appear here after they have been completed.</p>
            </div>
          </Card>
        )}
      </div>

      {/* 🔹 Modal for Event Details */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
            <DialogDescription>
              {selectedEvent && formatDate(selectedEvent.start_date)} — {selectedEvent?.location}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedEvent?.image_path ? (
              <img
                src={`/storage/${selectedEvent.image_path}`}
                alt={selectedEvent.name}
                className="aspect-[16/9] object-cover w-full rounded-md"
              />
            ) : (
              <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center text-gray-500 rounded-md">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedEvent?.description}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
