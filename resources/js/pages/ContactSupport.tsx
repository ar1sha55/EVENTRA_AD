import { useState, FormEvent, useMemo } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, Link, usePage } from "@inertiajs/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Headphones,
  Send,
  History,
  CheckCircle2,
  Mail,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";

// Validation helper functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const MIN_MESSAGE_LENGTH = 20;
const MIN_SUBJECT_LENGTH = 5;

export default function ContactSupport() {
  const { props } = usePage();
  const user = (props as any).auth?.user;

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Track which fields have been touched (for showing validation on blur)
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    subject: false,
    message: false,
  });

  const categories = [
    { value: "general", label: "General Inquiry" },
    { value: "technical", label: "Technical Issue" },
    { value: "account", label: "Account Problem" },
    { value: "event", label: "Event Related" },
    { value: "event_registration", label: "Event Registration Issue" },
    { value: "payment", label: "Payment Issue" },
    { value: "other", label: "Other" },
  ];

  // Compute validation errors
  const errors = useMemo(() => {
    return {
      name: !name.trim() ? "Name is required" : null,
      email: !email.trim()
        ? "Email is required"
        : !isValidEmail(email)
        ? "Please enter a valid email address"
        : null,
      subject: !subject.trim()
        ? "Subject is required"
        : subject.trim().length < MIN_SUBJECT_LENGTH
        ? `Subject must be at least ${MIN_SUBJECT_LENGTH} characters`
        : null,
      message: !message.trim()
        ? "Message is required"
        : message.trim().length < MIN_MESSAGE_LENGTH
        ? `Message must be at least ${MIN_MESSAGE_LENGTH} characters`
        : null,
    };
  }, [name, email, subject, message]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return !errors.name && !errors.email && !errors.subject && !errors.message;
  }, [errors]);

  // Handle field blur to mark as touched
  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Get field validation status for styling
  const getFieldStatus = (field: keyof typeof errors) => {
    if (!touched[field]) return "default";
    return errors[field] ? "error" : "success";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      subject: true,
      message: true,
    });

    if (!isFormValid) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('/contact-support', {
        name,
        email,
        subject,
        message,
        category,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSubmitted(true);
        setSubject("");
        setMessage("");
        setCategory("general");
        setTouched({ name: false, email: false, subject: false, message: false });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit support ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Field wrapper component for consistent styling
  const FieldError = ({ error, touched }: { error: string | null; touched: boolean }) => {
    if (!touched || !error) return null;
    return (
      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    );
  };

  const FieldSuccess = ({ touched, error }: { touched: boolean; error: string | null }) => {
    if (!touched || error) return null;
    return (
      <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
        <Check className="h-3 w-3" />
        Looks good!
      </p>
    );
  };

  if (submitted) {
    return (
      <AppLayout breadcrumbs={[{ title: "Contact Support", href: "/contact-support" }]}>
        <Head title="Contact Support" />
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-3xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-12 pb-8">
              <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ticket Submitted!</h2>
              <p className="text-muted-foreground mb-2">
                We've received your support request and will get back to you within 24-48 hours.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You'll receive an email notification when we respond.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setSubmitted(false)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Another Ticket
                </Button>
                <Link href="/support-history">
                  <Button variant="outline" className="w-full sm:w-auto">
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

      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Headphones className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Contact Support</h1>
              <p className="text-muted-foreground">
                Need help? Submit a support ticket and we'll assist you.
              </p>
            </div>
          </div>
          <Link href="/support-history">
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              My Tickets
            </Button>
          </Link>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Support Ticket</CardTitle>
            <CardDescription>
              Fill out the form below and our team will respond as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => handleBlur("name")}
                      maxLength={255}
                      className={cn(
                        getFieldStatus("name") === "error" && "border-red-500 focus-visible:ring-red-500",
                        getFieldStatus("name") === "success" && "border-green-500 focus-visible:ring-green-500"
                      )}
                    />
                    {getFieldStatus("name") === "success" && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <FieldError error={errors.name} touched={touched.name} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur("email")}
                      maxLength={255}
                      className={cn(
                        getFieldStatus("email") === "error" && "border-red-500 focus-visible:ring-red-500",
                        getFieldStatus("email") === "success" && "border-green-500 focus-visible:ring-green-500"
                      )}
                    />
                    {getFieldStatus("email") === "success" && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <FieldError error={errors.email} touched={touched.email} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="subject"
                      type="text"
                      placeholder="Brief description of your issue"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      onBlur={() => handleBlur("subject")}
                      maxLength={255}
                      className={cn(
                        getFieldStatus("subject") === "error" && "border-red-500 focus-visible:ring-red-500",
                        getFieldStatus("subject") === "success" && "border-green-500 focus-visible:ring-green-500"
                      )}
                    />
                    {getFieldStatus("subject") === "success" && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <FieldError error={errors.subject} touched={touched.subject} />
                  {touched.subject && !errors.subject && (
                    <FieldSuccess touched={touched.subject} error={errors.subject} />
                  )}
                </div>
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
                  onBlur={() => handleBlur("message")}
                  maxLength={2000}
                  rows={6}
                  className={cn(
                    "resize-none",
                    getFieldStatus("message") === "error" && "border-red-500 focus-visible:ring-red-500",
                    getFieldStatus("message") === "success" && "border-green-500 focus-visible:ring-green-500"
                  )}
                />
                <div className="flex justify-between items-center">
                  <div>
                    <FieldError error={errors.message} touched={touched.message} />
                    {touched.message && !errors.message && (
                      <FieldSuccess touched={touched.message} error={errors.message} />
                    )}
                  </div>
                  <p className={cn(
                    "text-xs text-right",
                    message.length < MIN_MESSAGE_LENGTH && touched.message
                      ? "text-red-500"
                      : "text-muted-foreground"
                  )}>
                    {message.length}/2000 characters
                    {message.length < MIN_MESSAGE_LENGTH && (
                      <span className="ml-1">
                        (min {MIN_MESSAGE_LENGTH})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
          <CardFooter className="bg-muted/50 border-t flex-col items-start gap-3 py-4">
            <p className="text-sm text-muted-foreground">
              Our team typically responds within 24-48 hours.
            </p>
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border w-full">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">For urgent matters, contact us directly</p>
                <a
                  href="mailto:eventra111@gmail.com"
                  className="text-sm font-medium text-orange-600 hover:underline"
                >
                  eventra111@gmail.com
                </a>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
