import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, router } from "@inertiajs/react";
import { useState, FormEvent } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, UserPlus, Pencil, Trash2, Mail } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Manage Members",
    href: "/manager/manage-members",
  },
];

export default function ManageMembersPage() {
  const [members, setMembers] = useState([
    {
      id: 1,
      name: "Aishah Rahman",
      email: "aishah@graduate.utm.my",
      matricId: "A23CS0135",
      joined: "2025-03-20",
    },
    {
      id: 2,
      name: "Nur Alia",
      email: "nuralia@graduate.utm.my",
      matricId: "A23CS0241",
      joined: "2025-04-01",
    },
  ]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    matricId: "",
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [emailDialog, setEmailDialog] = useState({
    open: false,
    recipientEmail: "",
    recipientName: "",
  });

  const [emailForm, setEmailForm] = useState({
    subject: "",
    message: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.matricId) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    if (editingId) {
      setMembers((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, ...form } : m))
      );
      setEditingId(null);
    } else {
      const newMember = {
        id: members.length + 1,
        name: form.name,
        email: form.email,
        matricId: form.matricId,
        joined: new Date().toISOString().split("T")[0],
      };
      setMembers([...members, newMember]);
    }

    setForm({ name: "", email: "", matricId: "" });
    setIsAdding(false);
  };

  const handleEdit = (id: number) => {
    const member = members.find((m) => m.id === id);
    if (member) {
      setForm({
        name: member.name,
        email: member.email,
        matricId: member.matricId,
      });
      setEditingId(id);
      setIsAdding(true);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this member?")) {
      setMembers(members.filter((m) => m.id !== id));
    }
  };

  const handleOpenEmailDialog = (member: {
    name: string;
    email: string;
  }) => {
    setEmailDialog({
      open: true,
      recipientEmail: member.email,
      recipientName: member.name,
    });
    setEmailForm({
      subject: "",
      message: "",
    });
  };

  const handleCloseEmailDialog = () => {
    setEmailDialog({
      open: false,
      recipientEmail: "",
      recipientName: "",
    });
    setEmailForm({
      subject: "",
      message: "",
    });
  };

  const handleSendEmail = (e: FormEvent) => {
    e.preventDefault();

    if (!emailForm.subject || !emailForm.message) {
      alert("⚠️ Please fill in both subject and message.");
      return;
    }

    // Send email via backend API
    router.post(
      "/manager/send-email",
      {
        recipient_email: emailDialog.recipientEmail,
        recipient_name: emailDialog.recipientName,
        subject: emailForm.subject,
        message: emailForm.message,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          alert(`✅ Email sent successfully to ${emailDialog.recipientName}`);
          handleCloseEmailDialog();
        },
        onError: (errors) => {
          console.error("Failed to send email:", errors);
          alert("❌ Failed to send email. Please try again.");
        },
      }
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manage Members" />

      <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6 text-muted-foreground" />
            Manage Members
          </h1>
          <Button onClick={() => setIsAdding(!isAdding)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {isAdding ? "Cancel" : "Add Member"}
          </Button>
        </div>

        {/* Add/Edit Member Form */}
        {isAdding && (
          <Card className="border-dashed border-2">
            <CardHeader>
              <CardTitle>
                {editingId ? "Edit Member" : "Add New Member"}
              </CardTitle>
              <CardDescription>
                {editingId
                  ? "Update the member information below."
                  : "Fill in the details to add a new member."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Enter full name"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="Enter email"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Matric ID</label>
                  <input
                    type="text"
                    value={form.matricId}
                    onChange={(e) =>
                      setForm({ ...form, matricId: e.target.value })
                    }
                    placeholder="e.g., A23CS0135"
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>

                <Button type="submit" className="self-end">
                  {editingId ? "Update Member" : "Add Member"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Member List</CardTitle>
            <CardDescription>
              Manage registered members for your events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Matric ID</th>
                    <th className="px-4 py-2 text-center">Joined</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-2">{m.name}</td>
                      <td className="px-4 py-2">{m.email}</td>
                      <td className="px-4 py-2">{m.matricId}</td>
                      <td className="px-4 py-2 text-center">{m.joined}</td>
                      <td className="px-4 py-2 text-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenEmailDialog(m)}
                          title="Send email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(m.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(m.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {members.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">
                  No members found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Dialog */}
        <Dialog open={emailDialog.open} onOpenChange={handleCloseEmailDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Send Email to {emailDialog.recipientName}</DialogTitle>
              <DialogDescription>
                Compose an email to {emailDialog.recipientEmail}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium">To:</label>
                <input
                  type="email"
                  value={emailDialog.recipientEmail}
                  disabled
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-muted"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Subject</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, subject: e.target.value })
                  }
                  placeholder="Enter email subject"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, message: e.target.value })
                  }
                  placeholder="Enter your message here..."
                  rows={8}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm resize-y"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseEmailDialog}
                >
                  Cancel
                </Button>
                <Button type="submit" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
