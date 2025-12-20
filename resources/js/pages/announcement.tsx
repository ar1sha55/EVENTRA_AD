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
    href: "/announcement",
  },
];

// ✅ Define a type for announcement items
interface Announcement {
  id: number;
  title: string;
  message: string;
  recipients_count: number;
  sent_at: string;
  user: {
    id: number;
    name: string;
  };
}

interface Props {
  announcements: Announcement[];
}

export default function AnnouncementsPage({ announcements = [] }: Props) {
  const page = usePage();
  const props = page.props as any;
  const flash = props.flash || {};

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Use real announcements from backend

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Announcements" />

      <div className="flex flex-col gap-6 p-4 h-full">
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
                    {formatDate(a.sent_at)}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {a.message}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Posted by: {a.user.name}
                </p>
              </CardContent>
            </Card>
          ))}

          {announcements.length === 0 && (
            <div className="text-center py-12">
              <Megaphone className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-lg text-muted-foreground">
                No announcements available.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
