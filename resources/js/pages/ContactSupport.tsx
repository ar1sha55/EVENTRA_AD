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
import { Input } from "@/components/ui/input";
import { MessageCircle } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Contact Support",
    href: "/contact-support",
  },
];

export default function ContactSupportPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      alert(
        `✅ Message sent!\n\nName: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\nMessage: ${form.message}`
      );
      setIsSubmitting(false);
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 1000);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Contact Support" />

      <div className="flex flex-col gap-6 p-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Contact Support</h1>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Have a question or issue? Fill out the form below and our support
              team will respond as soon as possible.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-4 p-6">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="What is your issue about?"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Describe your problem or question..."
                  rows={5}
                  required
                  className="mt-1 flex min-h-[120px] w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end p-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-sm text-muted-foreground text-center">
          Or reach us directly at{" "}
          <span className="font-medium text-foreground">
            support@eventra.org
          </span>
        </div>
      </div>
    </AppLayout>
  );
}
