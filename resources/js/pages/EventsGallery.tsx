import { useState } from "react";
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
import { CalendarDays, Info, ImageIcon } from "lucide-react";
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

        {/* Gallery Grid */}
        {events.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card
                key={event.id}
                className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 rounded-xl"
              >
                {/* Event Image */}
                {event.image_path ? (
                  <img
                    src={`/storage/${event.image_path}`}
                    alt={event.name}
                    className="aspect-[16/9] object-cover w-full"
                  />
                ) : (
                  <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center text-gray-500">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    {event.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(event.start_date)} · {event.location}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </CardContent>

                <CardFooter className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <Info className="mr-2 h-4 w-4" /> View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
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
