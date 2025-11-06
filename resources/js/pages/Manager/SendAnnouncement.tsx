import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Megaphone } from "lucide-react";

const breadcrumbs = [
  { title: "Send Announcement", href: "/send-announcement" },
];

export default function SendAnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    // Simulate backend request
    setTimeout(() => {
      alert("Announcement sent successfully!");
      setIsSending(false);
      setTitle("");
      setMessage("");
      setDate("");
    }, 1000);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Send Announcement" />
      <div className="p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Send Announcement</h1>
        </div>

        {/* Form */}
        <Card className="shadow-sm max-w-2xl">
          <CardHeader>
            <CardTitle>Create Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Announcement Title
                </label>
                <Input
                  type="text"
                  placeholder="Enter announcement title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Message
                </label>
                <Input
                  type="text"
                  placeholder="Enter your announcement message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="py-8" // adds padding to make it look like a text area
                />
              </div>

              <Button
                type="submit"
                disabled={isSending}
                className="self-end px-6 py-2 mt-2"
              >
                {isSending ? "Sending..." : "Send Announcement"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
