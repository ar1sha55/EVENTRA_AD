import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Send, Sparkles } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Send Message",
    href: "/manager/send-message",
  },
];

export default function SendMessagePage() {
  const [form, setForm] = useState({
    eventId: "",
    message: "",
  });

  const [isSending, setIsSending] = useState(false);

  // Mock event list (replace with backend-provided events later)
  const events = [
    {
      id: "1",
      name: "Community Clean-Up Drive",
      date: "November 10, 2024",
      location: "City Park",
    },
    {
      id: "2",
      name: "Food Donation Week",
      date: "January 15–20, 2025",
      location: "Community Hall",
    },
    {
      id: "3",
      name: "Volunteer Appreciation Day",
      date: "December 1, 2024",
      location: "Main Hall",
    },
  ];

  // handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // handle send blast
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.eventId || !form.message.trim()) {
      alert("⚠️ Please select an event and enter a message before sending.");
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      const eventName = events.find((ev) => ev.id === form.eventId)?.name;
      alert(
        `🚀 Message blasted successfully!\n\nEvent: ${eventName}\nMessage:\n${form.message}\n\n(This would normally send to Telegram.)`
      );
      setForm({ eventId: "", message: "" });
      setIsSending(false);
    }, 1000);
  };

  // auto-generate message based on event
  const handleAutoGenerate = () => {
    if (!form.eventId) {
      alert("⚠️ Please select an event first.");
      return;
    }

    const event = events.find((e) => e.id === form.eventId);
    if (event) {
      const autoMessage = `📢 *${event.name}*\n\n🗓 Date: ${event.date}\n📍 Location: ${event.location}\n\nJoin us for this meaningful volunteering event! Let's make a positive impact together 💪\n\nRegister or learn more in your dashboard.`;
      setForm({ ...form, message: autoMessage });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Send Message" />

      <div className="flex flex-col gap-6 p-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Send Message (Blast to Telegram)</h1>
        </div>

        {/* Send Message Card */}
        <Card>
          <CardHeader>
            <CardTitle>Blast Event Update</CardTitle>
            <CardDescription>
              Choose an event and send an update or announcement to all participants through Telegram.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSend}>
            <CardContent className="flex flex-col gap-4 p-6">
              {/* Event Selection */}
              <div>
                <label className="text-sm font-medium">Select Event</label>
                <Select
                  value={form.eventId}
                  onValueChange={(val) => setForm({ ...form, eventId: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message Box */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Message Content</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoGenerate}
                    className="gap-1"
                  >
                    <Sparkles className="h-4 w-4" /> Auto Generate
                  </Button>
                </div>

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Type or generate your message..."
                  rows={6}
                  className="mt-2 flex w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end p-6">
              <Button
                type="submit"
                disabled={isSending}
                className="px-6 py-2 text-sm font-medium"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSending ? "Sending..." : "Send Blast"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-sm text-muted-foreground text-center">
          Ensure your Telegram bot is properly connected in system settings before sending.
        </div>
      </div>
    </AppLayout>
  );
}
