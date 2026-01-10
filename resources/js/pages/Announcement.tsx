import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, usePage, router } from "@inertiajs/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, CalendarDays, Bell, RefreshCw } from "lucide-react";

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
  message: string;
  sent_at: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
}

export default function AnnouncementsPage() {
  const page = usePage();
  const props = page.props as any;
  const flash = props.flash || {};

  const announcements: Announcement[] = props.announcements ?? [];

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Announcements" />

      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Announcements</h1>
              <p className="text-muted-foreground">
                Stay updated with the latest news and updates
              </p>
            </div>
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
                    {formatDate(a.sent_at || a.created_at)}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {a.message}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Posted by: {a.user?.name || 'System'}
                </p>
              </CardContent>
            </Card>
          ))}

          {announcements.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Bell className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Announcements Yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  There are no announcements at the moment. Check back later for updates and news from the organizers.
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.reload()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
