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
  title: string;
  date: string;
  location: string;
  description: string;
  insights: string;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Events Gallery", href: "/manager/events-gallery" },
];

export default function EventsGallery() {
  const page = usePage();
  const props = page.props as any;
  const flash = props.flash || {};

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const events: EventItem[] = props.events ?? [
    {
      id: 1,
      title: "Community Clean-Up Drive",
      date: "January 20, 2024",
      location: "Taman Desa Park",
      description:
        "A community-wide effort to clean up public spaces and promote environmental awareness among students and residents.",
      insights:
        "Over 80 volunteers collected 120kg of waste. Local media coverage increased community awareness of recycling efforts.",
    },
    {
      id: 2,
      title: "Food Donation Program",
      date: "April 10, 2024",
      location: "Kuala Lumpur City Center",
      description:
        "Volunteers distributed food packs to homeless individuals and low-income families, supported by student organizations.",
      insights:
        "500 meals distributed. Collaboration with 3 NGOs. Positive feedback from beneficiaries on program organization.",
    },
    {
      id: 3,
      title: "Tree Planting Initiative",
      date: "July 15, 2024",
      location: "Bukit Kiara Forest Reserve",
      description:
        "An environmental volunteering event where students planted trees to promote sustainability and biodiversity.",
      insights:
        "Planted 300 trees with 60 student volunteers. Follow-up visits planned to monitor growth every 6 months.",
    },
    {
      id: 4,
      title: "Blood Donation Drive",
      date: "October 5, 2024",
      location: "School Multipurpose Hall",
      description:
        "A collaboration with the National Blood Centre to encourage students and staff to contribute to the national blood supply.",
      insights:
        "90 donors registered; 75 successful donations collected. Event recognized by local health authorities.",
    },
  ];

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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 rounded-xl"
            >
              {/* 🟦 Placeholder Image Box */}
              <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center text-gray-500">
                <ImageIcon className="h-8 w-8" />
              </div>

              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {event.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {event.date} · {event.location}
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
                  <Info className="mr-2 h-4 w-4" /> View Insights
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* 🔹 Modal for Event Insights */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.date} — {selectedEvent?.location}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center text-gray-500 rounded-md">
              <ImageIcon className="h-8 w-8" />
            </div>
            <p className="text-sm text-gray-700">{selectedEvent?.description}</p>
            <div className="rounded-md bg-gray-100 dark:bg-gray-800 p-3">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {selectedEvent?.insights}
              </p>
            </div>
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
