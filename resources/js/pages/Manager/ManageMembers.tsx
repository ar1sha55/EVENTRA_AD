import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { useState, FormEvent, useEffect, ChangeEvent } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Mail,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  User as UserIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Manage Members",
    href: "/manager/manage-members",
  },
];

interface Member {
  id: number;
  name: string;
  email: string;
  secondary_email?: string;
  matric_id: string;
  phone_number?: string;
  nationality?: string;
  gender?: string;
  faculty?: string;
  profile_picture?: string;
  created_at: string;
}

interface Props {
  members?: Member[];
}

interface FormState {
    name: string;
    email: string;
    secondary_email: string;
    matric_id: string;
    phone_number: string;
    nationality: string;
    gender: string;
    faculty: string;
    password?: string;
    password_confirmation?: string;
    profile_picture?: File | null;
}


export default function ManageMembersPage({ members = [] }: Props) {
  const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(members || []);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    secondary_email: "",
    matric_id: "",
    phone_number: "",
    nationality: "",
    gender: "",
    faculty: "",
    password: "",
    password_confirmation: "",
    profile_picture: null,
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [emailDialog, setEmailDialog] = useState({
    open: false,
    recipientEmail: "",
    recipientName: "",
  });

  const [emailForm, setEmailForm] = useState({
    subject: "",
    message: "",
  });

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  // Update filtered members when search query or sort option changes
  useEffect(() => {
    let filtered = members.filter(
      (member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.matric_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "date-newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date-oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredMembers(sorted);
  }, [searchQuery, sortBy, members]);

  // Handle flash messages
  useEffect(() => {
    if (flash?.success) {
      setDialogMessage(flash.success);
      setShowSuccessDialog(true);
    } else if (flash?.error) {
      setDialogMessage(flash.error);
      setShowErrorDialog(true);
    }
  }, [flash]);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      secondary_email: "",
      matric_id: "",
      phone_number: "",
      nationality: "",
      gender: "",
      faculty: "",
      password: "",
      password_confirmation: "",
      profile_picture: null,
    });
    setEditingMember(null);
    setIsAdding(false);
    setPreview(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const postData = {
        ...form,
    };

    if (editingMember) {
      router.post(`/manager/members/${editingMember.id}`, {
        _method: 'PUT',
        ...postData,
      }, {
        preserveScroll: true,
        onSuccess: () => resetForm(),
      });
    } else {
      router.post('/manager/members', postData, {
        preserveScroll: true,
        onSuccess: () => resetForm(),
      });
    }
  };

  const handleEdit = (member: Member) => {
    setForm({
      name: member.name,
      email: member.email,
      secondary_email: member.secondary_email || "",
      matric_id: member.matric_id,
      phone_number: member.phone_number || "",
      nationality: member.nationality || "",
      gender: member.gender || "",
      faculty: member.faculty || "",
      password: "",
      password_confirmation: "",
      profile_picture: null,
    });
    setEditingMember(member);
    setIsAdding(true);
    setPreview(member.profile_picture ? `/storage/${member.profile_picture}` : null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm({ ...form, profile_picture: file });
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleDelete = (member: Member) => {
    setDeletingMember(member);
  };

  const confirmDelete = () => {
    if (deletingMember) {
      router.delete(`/manager/members/${deletingMember.id}`, {
        preserveScroll: true,
        onSuccess: () => setDeletingMember(null),
      });
    }
  };

  const handleOpenEmailDialog = (member: Member) => {
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
      return;
    }

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
        onSuccess: () => handleCloseEmailDialog(),
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manage Members" />

      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Manage Members
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage all registered members
            </p>
          </div>
          <Button
            onClick={() => {
              if (isAdding) {
                resetForm();
              } else {
                setIsAdding(true);
              }
            }}
            className="gap-2"
            size="lg"
          >
            <UserPlus className="h-5 w-5" />
            {isAdding ? "Cancel" : "Add Member"}
          </Button>
        </div>

        {/* Add/Edit Member Form */}
        {isAdding && (
          <Card className="border-2 border-dashed border-primary/50">
            <CardHeader>
              <CardTitle className="text-2xl">
                {editingMember ? "Edit Member" : "Add New Member"}
              </CardTitle>
              <CardDescription>
                {editingMember
                  ? "Update the member information below."
                  : "Fill in the details to add a new member."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                 {/* Profile Picture */}
                 <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Profile Picture</h3>
                  <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {preview ? (
                              <img src={preview} alt="Profile preview" className="w-full h-full object-cover" />
                          ) : (
                              <UserIcon className="w-12 h-12 text-muted-foreground" />
                          )}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="profile_picture">Upload Image</Label>
                          <Input
                              id="profile_picture"
                              type="file"
                              onChange={handleFileChange}
                              accept="image/*"
                              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          />
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB.</p>
                      </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Enter full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="matric_id">Matric ID *</Label>
                      <Input
                        id="matric_id"
                        value={form.matric_id}
                        onChange={(e) => setForm({ ...form, matric_id: e.target.value })}
                        placeholder="e.g., A23CS0135"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Primary Email (UTM) *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="name@graduate.utm.my"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary_email">Secondary Email</Label>
                      <Input
                        id="secondary_email"
                        type="email"
                        value={form.secondary_email}
                        onChange={(e) => setForm({ ...form, secondary_email: e.target.value })}
                        placeholder="personal@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={form.phone_number}
                        onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                        placeholder="+60123456789"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={form.gender} onValueChange={(value) => setForm({ ...form, gender: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Academic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="faculty">Faculty</Label>
                      <Select value={form.faculty} onValueChange={(value) => setForm({ ...form, faculty: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select faculty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fke">FKE - Electrical Engineering</SelectItem>
                          <SelectItem value="fkm">FKM - Mechanical Engineering</SelectItem>
                          <SelectItem value="fc">FC - Computing</SelectItem>
                          <SelectItem value="fab">FAB - Built Environment</SelectItem>
                          <SelectItem value="fka">FKA - Chemical Engineering</SelectItem>
                          <SelectItem value="fs">FS - Science</SelectItem>
                          <SelectItem value="fcee">FCEE - Civil Engineering</SelectItem>
                          <SelectItem value="fm">FM - Management</SelectItem>
                          <SelectItem value="fssh">FSSH - Social Sciences</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Select value={form.nationality} onValueChange={(value) => setForm({ ...form, nationality: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="malaysia">Malaysia</SelectItem>
                          <SelectItem value="indonesia">Indonesia</SelectItem>
                          <SelectItem value="singapore">Singapore</SelectItem>
                          <SelectItem value="japan">Japan</SelectItem>
                          <SelectItem value="china">China</SelectItem>
                          <SelectItem value="korea">Korea</SelectItem>
                          <SelectItem value="egypt">Egypt</SelectItem>
                          <SelectItem value="yemen">Yemen</SelectItem>
                          <SelectItem value="thailand">Thailand</SelectItem>
                          <SelectItem value="vietnam">Vietnam</SelectItem>
                          <SelectItem value="saudi arabia">Saudi Arabia</SelectItem>
                          <SelectItem value="nigeria">Nigeria</SelectItem>
                          <SelectItem value="iraq">Iraq</SelectItem>
                          <SelectItem value="iran">Iran</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {editingMember ? "Change Password (Optional)" : "Password *"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password {!editingMember && "*"}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Enter password"
                        required={!editingMember}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password_confirmation">Confirm Password {!editingMember && "*"}</Label>
                      <Input
                        id="password_confirmation"
                        type="password"
                        value={form.password_confirmation}
                        onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                        placeholder="Confirm password"
                        required={!editingMember}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingMember ? "Update Member" : "Add Member"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Members List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Member List ({filteredMembers.length})</CardTitle>
                  <CardDescription>
                    Manage registered members for your events.
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="w-full sm:w-48">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="date-newest">Newest First</SelectItem>
                      <SelectItem value="date-oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {searchQuery ? "No members found" : "No members yet"}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search query." : "Add your first member above."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold w-12">Profile</th>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Matric ID</th>
                      <th className="px-4 py-3 text-left font-semibold">Faculty</th>
                      <th className="px-4 py-3 text-center font-semibold">Date Joined</th>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-2">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {member.profile_picture ? (
                                    <img src={`/storage/${member.profile_picture}`} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-6 h-6 text-muted-foreground" />
                                )}
                            </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{member.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                        <td className="px-4 py-3">{member.matric_id}</td>
                        <td className="px-4 py-3 uppercase">{member.faculty || '-'}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
                          {formatDate(member.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingMember(member)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEmailDialog(member)}
                              title="Send email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(member)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(member)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Member Dialog */}
        <Dialog open={!!viewingMember} onOpenChange={() => setViewingMember(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
              <DialogDescription>
                Full information about {viewingMember?.name}
              </DialogDescription>
            </DialogHeader>
            {viewingMember && (
              <div className="space-y-4 pt-4">
                <div className="flex justify-center mb-4">
                    <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {viewingMember.profile_picture ? (
                            <img src={`/storage/${viewingMember.profile_picture}`} alt={viewingMember.name} className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-16 h-16 text-muted-foreground" />
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{viewingMember.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Matric ID</Label>
                    <p className="font-medium">{viewingMember.matric_id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Primary Email</Label>
                    <p className="font-medium">{viewingMember.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Secondary Email</Label>
                    <p className="font-medium">{viewingMember.secondary_email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{viewingMember.phone_number || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Gender</Label>
                    <p className="font-medium capitalize">{viewingMember.gender || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Faculty</Label>
                    <p className="font-medium uppercase">{viewingMember.faculty || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nationality</Label>
                    <p className="font-medium capitalize">{viewingMember.nationality || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Joined Date</Label>
                    <p className="font-medium">{formatDate(viewingMember.created_at)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={emailDialog.open} onOpenChange={handleCloseEmailDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Send Email to {emailDialog.recipientName}</DialogTitle>
              <DialogDescription>
                Compose an email to {emailDialog.recipientEmail}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-to">To</Label>
                <Input
                  id="email-to"
                  type="email"
                  value={emailDialog.recipientEmail}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, subject: e.target.value })
                  }
                  placeholder="Enter email subject"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-message">Message</Label>
                <textarea
                  id="email-message"
                  value={emailForm.message}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, message: e.target.value })
                  }
                  placeholder="Enter your message here..."
                  rows={8}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                  required
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{deletingMember?.name}</strong> and all their associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Success Dialog */}
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 mx-auto">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <AlertDialogTitle className="text-center">Success!</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                {dialogMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Error Dialog */}
        <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-center">Error</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                {dialogMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
                Close
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}