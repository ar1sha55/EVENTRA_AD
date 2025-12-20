import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, usePage } from "@inertiajs/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Megaphone, CalendarDays } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Announcements",
    href: "/announcements",
  },
];

// ✅ Define a type for announcement items
interface Announcement {
  id: number;
  title: string;
  date: string;
  author: string;
  message: string;
}

export default function AnnouncementsPage() {
  const page = usePage();
  const props = page.props as any;
  const flash = props.flash || {};

  // Mock data — replace with backend announcements later
  const announcements: Announcement[] = props.announcements ?? [
    {
      id: 1,
      title: "Community Clean-Up Drive :D",
      date: "November 10, 2024",
      author: "Event Manager",
      message:
        "Join us for a community clean-up at the city park. Volunteers are encouraged to bring reusable gloves and bags. Let's make our environment cleaner!",
    },
    {
      id: 2,
      title: "Volunteer Appreciation Day",
      date: "December 1, 2024",
      author: "Admin",
      message:
        "A big thank you to all our volunteers this year! Join us at the main hall for a small ceremony and appreciation lunch.",
    },
    {
      id: 3,
      title: "Food Donation Week Launch",
      date: "January 15, 2025",
      author: "Event Manager",
      message:
        "We’re launching our annual Food Donation Week! Check the events section for details on how to participate and contribute.",
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Announcements" />

      <div className="flex flex-col gap-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Announcements</h1>
          </div>

          {flash.success && (
            <div className="rounded-md bg-green-50 px-3 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
              {flash.success}
            </div>
          )}
        </div>

        {/* Announcements List */}
        <div className="flex flex-col gap-4">
          {announcements.map((a: Announcement) => (
            <Card
              key={a.id}
              className="border-l-4 border-primary shadow-sm hover:shadow-md transition-all duration-200"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {a.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {a.date}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {a.message}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Posted by: {a.author}
                </p>
              </CardContent>
            </Card>
          ))}

          {announcements.length === 0 && (
            <p className="text-center text-muted-foreground">
              No announcements available.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
