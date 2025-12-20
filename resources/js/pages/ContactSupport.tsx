import { useState, FormEvent } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, Link, usePage } from "@inertiajs/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send, History, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function ContactSupport() {
  const { props } = usePage();
  const user = (props as any).auth?.user;

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('/contact-support', {
        name,
        email,
        subject,
        message,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSubmitted(true);
        // Reset form
        setSubject("");
        setMessage("");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit support ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AppLayout breadcrumbs={[{ title: "Contact Support", href: "/contact-support" }]}>
        <Head title="Contact Support" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 bg-gradient-to-br from-purple-50/30 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
          <Card className="max-w-lg w-full text-center shadow-xl border-2 hover:shadow-2xl transition-shadow duration-300">
            <CardContent className="pt-12 pb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-xl animate-in zoom-in duration-500">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ticket Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                We've received your support request and will get back to you as soon as possible.
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setSubmitted(false)} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Another Ticket
                </Button>
                <Link href="/support-history">
                  <Button variant="outline" className="w-full">
                    <History className="h-4 w-4 mr-2" />
                    View My Tickets
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ title: "Contact Support", href: "/contact-support" }]}>
      <Head title="Contact Support" />
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">
                  Contact Support
                </h1>
              </div>
              <p className="text-muted-foreground mt-1">
                Need help? Submit a support ticket and we'll get back to you.
              </p>
            </div>
            <Link href="/support-history">
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                My Tickets
              </Button>
            </Link>
          </div>

          {/* Form Card */}
          <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Submit Support Ticket</CardTitle>
            <CardDescription>
              Fill out the form below and our team will respond within 24-48 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={255}
                    className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                    className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  maxLength={255}
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  maxLength={2000}
                  rows={8}
                  className="resize-none transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/2000 characters
                </p>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-200" size="lg">
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Support Ticket
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/50 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> For urgent matters, you can also email us directly at{" "}
              <a
                href="mailto:utmvolunteerclub@gmail.com"
                className="text-purple-600 hover:underline"
              >
                utmvolunteerclub@gmail.com
              </a>
            </p>
          </CardFooter>
        </Card>
        </div>
      </div>
    </AppLayout>
  );
}
