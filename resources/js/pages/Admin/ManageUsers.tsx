import AppLayout from "@/layouts/app-layout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState, FormEvent, useEffect, ChangeEvent, useMemo } from "react";
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
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  Shield,
  UserCog,
  CheckSquare,
  Square,
  MoreHorizontal,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  name: string;
  email: string;
  secondary_email?: string;
  matric_id: string;
  phone_number?: string;
  nationality?: string;
  gender?: string;
  faculty?: string;
  role: 'admin' | 'manager' | 'member';
  profile_picture?: string;
  email_verified_at?: string;
  created_at: string;
}

interface Props {
  users: User[];
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
  role: string;
  password?: string;
  password_confirmation?: string;
  profile_picture?: File | null;
}

export default function ManageUsersPage({ users }: Props) {
  const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'member'>('all');

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    secondary_email: "",
    matric_id: "",
    phone_number: "",
    nationality: "",
    gender: "",
    faculty: "",
    role: "member",
    password: "",
    password_confirmation: "",
    profile_picture: null,
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkRoleDialog, setShowBulkRoleDialog] = useState(false);
  const [bulkNewRole, setBulkNewRole] = useState<'admin' | 'manager' | 'member'>('member');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Calculate statistics using useMemo (client-side)
  const statistics = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      managers: users.filter(u => u.role === 'manager').length,
      members: users.filter(u => u.role === 'member').length,
    };
  }, [users]);

  // Filter and sort users using useMemo (client-side - instant and responsive)
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply search filter (case-insensitive)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.matric_id.toLowerCase().includes(query)
      );
    }

    // Sort by created_at descending (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return filtered;
  }, [users, roleFilter, searchQuery]);

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
      role: "member",
      password: "",
      password_confirmation: "",
      profile_picture: null,
    });
    setEditingUser(null);
    setIsAdding(false);
    setPreview(null);
  };

  const handleResetFilter = () => {
    setSearchQuery('');
    setRoleFilter('all');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const postData = {
      ...form,
    };

    if (editingUser) {
      router.post(`/admin/users/${editingUser.id}`, {
        _method: 'PUT',
        ...postData,
      }, {
        preserveScroll: true,
        onSuccess: () => resetForm(),
      });
    } else {
      router.post('/admin/users', postData, {
        preserveScroll: true,
        onSuccess: () => resetForm(),
      });
    }
  };

  const handleEdit = (user: User) => {
    setForm({
      name: user.name,
      email: user.email,
      secondary_email: user.secondary_email || "",
      matric_id: user.matric_id,
      phone_number: user.phone_number || "",
      nationality: user.nationality || "",
      gender: user.gender || "",
      faculty: user.faculty || "",
      role: user.role,
      password: "",
      password_confirmation: "",
      profile_picture: null,
    });
    setEditingUser(user);
    setIsAdding(true);
    setPreview(user.profile_picture ? `/storage/${user.profile_picture}` : null);
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

  const handleDelete = (user: User) => {
    setDeletingUser(user);
  };

  const confirmDelete = () => {
    if (deletingUser) {
      router.delete(`/admin/users/${deletingUser.id}`, {
        preserveScroll: true,
        onSuccess: () => setDeletingUser(null),
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'manager':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200"><UserCog className="h-3 w-3 mr-1" />Manager</Badge>;
      case 'member':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200"><UserIcon className="h-3 w-3 mr-1" />Member</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const isAllSelected = filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length;
  const isSomeSelected = selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length;

  // Get current user ID to prevent self-actions
  const currentUserId = (usePage().props as any).auth?.user?.id;

  // Filter out current user from selection for delete operations
  const selectedUsersForDelete = selectedUsers.filter(id => id !== currentUserId);

  const handleBulkDelete = () => {
    if (selectedUsersForDelete.length === 0) {
      setDialogMessage("Cannot delete: You cannot delete your own account.");
      setShowErrorDialog(true);
      return;
    }
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    setIsBulkProcessing(true);
    router.post('/admin/users/bulk-delete', {
      user_ids: selectedUsersForDelete,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setSelectedUsers([]);
        setShowBulkDeleteDialog(false);
        setIsBulkProcessing(false);
      },
      onError: () => {
        setIsBulkProcessing(false);
      }
    });
  };

  const handleBulkRoleChange = () => {
    if (selectedUsers.length === 0) return;
    setShowBulkRoleDialog(true);
  };

  const confirmBulkRoleChange = () => {
    setIsBulkProcessing(true);
    router.post('/admin/users/bulk-role', {
      user_ids: selectedUsers.filter(id => id !== currentUserId),
      role: bulkNewRole,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setSelectedUsers([]);
        setShowBulkRoleDialog(false);
        setIsBulkProcessing(false);
      },
      onError: () => {
        setIsBulkProcessing(false);
      }
    });
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  return (
    <AppLayout>
      <Head title="Manage Users" />

      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Manage Users
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all users including admins, managers, and members
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              if (isAdding) {
                resetForm();
              } else {
                setIsAdding(true);
              }
            }}
            className="gap-2 bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            <UserPlus className="h-5 w-5" />
            {isAdding ? "Cancel" : "Add User"}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{statistics.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All system users
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">{statistics.admins}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Full system access
                  </p>
                </div>
                <Shield className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Managers</p>
                  <p className="text-2xl font-bold">{statistics.managers}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Event organizers
                  </p>
                </div>
                <UserCog className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Members</p>
                  <p className="text-2xl font-bold">{statistics.members}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Regular users
                  </p>
                </div>
                <UserIcon className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit User Form */}
        {isAdding && (
          <Card className="border-2 border-dashed border-primary/50">
            <CardHeader>
              <CardTitle className="text-2xl">
                {editingUser ? "Edit User" : "Add New User"}
              </CardTitle>
              <CardDescription>
                {editingUser
                  ? "Update the user information below."
                  : "Fill in the details to add a new user."}
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

                {/* Role Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">User Role *</h3>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Admins have full system access, Managers can manage events and members, Members can participate in events.
                    </p>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {editingUser ? "Change Password (Optional)" : "Password *"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password {!editingUser && "*"}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Enter password"
                        required={!editingUser}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password_confirmation">Confirm Password {!editingUser && "*"}</Label>
                      <Input
                        id="password_confirmation"
                        type="password"
                        value={form.password_confirmation}
                        onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                        placeholder="Confirm password"
                        required={!editingUser}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                    {editingUser ? "Update User" : "Add User"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>User List ({filteredUsers.length})</CardTitle>
                  <CardDescription>
                    {filteredUsers.length === statistics.total
                      ? 'View and manage all system users'
                      : `Showing ${filteredUsers.length} of ${statistics.total} users`}
                  </CardDescription>
                </div>
              </div>

              {/* Filters - same style as ManageEvents */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users by name, email, or matric ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Role Filter Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant={roleFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setRoleFilter('all')}
                        size="sm"
                      >
                        All ({statistics.total})
                      </Button>
                      <Button
                        variant={roleFilter === 'admin' ? 'default' : 'outline'}
                        onClick={() => setRoleFilter('admin')}
                        size="sm"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Admins ({statistics.admins})
                      </Button>
                      <Button
                        variant={roleFilter === 'manager' ? 'default' : 'outline'}
                        onClick={() => setRoleFilter('manager')}
                        size="sm"
                      >
                        <UserCog className="h-3 w-3 mr-1" />
                        Managers ({statistics.managers})
                      </Button>
                      <Button
                        variant={roleFilter === 'member' ? 'default' : 'outline'}
                        onClick={() => setRoleFilter('member')}
                        size="sm"
                      >
                        <UserIcon className="h-3 w-3 mr-1" />
                        Members ({statistics.members})
                      </Button>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {(searchQuery || roleFilter !== 'all') && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">Active filters:</span>
                      {searchQuery && (
                        <Badge variant="secondary" className="gap-1">
                          Search: "{searchQuery}"
                          <button
                            onClick={() => setSearchQuery('')}
                            className="ml-1 hover:text-foreground"
                          >
                            ×
                          </button>
                        </Badge>
                      )}
                      {roleFilter !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          Role: {roleFilter}
                          <button
                            onClick={() => setRoleFilter('all')}
                            className="ml-1 hover:text-foreground"
                          >
                            ×
                          </button>
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilter}
                        className="h-6 text-xs"
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bulk Action Bar */}
              {selectedUsers.length > 0 && (
                <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <CheckSquare className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-900 dark:text-orange-100">
                          {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSelection}
                          className="text-orange-700 hover:text-orange-900 hover:bg-orange-100"
                        >
                          Clear selection
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <UserCog className="h-4 w-4" />
                              Change Role
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Change role to</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setBulkNewRole('member'); handleBulkRoleChange(); }}>
                              <UserIcon className="h-4 w-4 mr-2 text-green-600" />
                              Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setBulkNewRole('manager'); handleBulkRoleChange(); }}>
                              <UserCog className="h-4 w-4 mr-2 text-blue-600" />
                              Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setBulkNewRole('admin'); handleBulkRoleChange(); }}>
                              <Shield className="h-4 w-4 mr-2 text-red-600" />
                              Admin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete ({selectedUsersForDelete.length})
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {searchQuery || roleFilter !== 'all' ? 'No users match your filters' : 'No users yet'}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery || roleFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Add your first user to get started.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold w-10">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold w-12">Profile</th>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Matric ID</th>
                      <th className="px-4 py-3 text-left font-semibold">Role</th>
                      <th className="px-4 py-3 text-center font-semibold">Joined</th>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-b hover:bg-muted/50 transition-colors ${
                          selectedUsers.includes(user.id) ? 'bg-orange-50 dark:bg-orange-950/20' : ''
                        }`}
                      >
                        <td className="px-4 py-2">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => handleSelectUser(user.id)}
                            className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {user.profile_picture ? (
                              <img src={`/storage/${user.profile_picture}`} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            {user.name}
                            {user.id === currentUserId && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3">{user.matric_id}</td>
                        <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingUser(user)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(user)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                              disabled={user.id === currentUserId}
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

        {/* View User Dialog */}
        <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Full information about {viewingUser?.name}
              </DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-4 pt-4">
                <div className="flex justify-center mb-4">
                  <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {viewingUser.profile_picture ? (
                      <img src={`/storage/${viewingUser.profile_picture}`} alt={viewingUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-16 h-16 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex justify-center mb-4">
                  {getRoleBadge(viewingUser.role)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{viewingUser.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Matric ID</Label>
                    <p className="font-medium">{viewingUser.matric_id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Primary Email</Label>
                    <p className="font-medium">{viewingUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Secondary Email</Label>
                    <p className="font-medium">{viewingUser.secondary_email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{viewingUser.phone_number || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Gender</Label>
                    <p className="font-medium capitalize">{viewingUser.gender || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Faculty</Label>
                    <p className="font-medium uppercase">{viewingUser.faculty || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nationality</Label>
                    <p className="font-medium capitalize">{viewingUser.nationality || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Joined Date</Label>
                    <p className="font-medium">{formatDate(viewingUser.created_at)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{deletingUser?.name}</strong> ({deletingUser?.role}) and all their associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete User
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

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedUsersForDelete.length} Users?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{selectedUsersForDelete.length}</strong> selected user{selectedUsersForDelete.length > 1 ? 's' : ''} and all their associated data.
                {selectedUsers.includes(currentUserId) && (
                  <span className="block mt-2 text-orange-600">
                    Note: Your own account will not be deleted.
                  </span>
                )}
                <span className="block mt-2 font-medium text-destructive">
                  This action cannot be undone.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBulkProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={isBulkProcessing}
              >
                {isBulkProcessing ? 'Deleting...' : `Delete ${selectedUsersForDelete.length} Users`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Role Change Confirmation Dialog */}
        <AlertDialog open={showBulkRoleDialog} onOpenChange={setShowBulkRoleDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Role for {selectedUsers.filter(id => id !== currentUserId).length} Users?</AlertDialogTitle>
              <AlertDialogDescription>
                This will change the role to <strong className="capitalize">{bulkNewRole}</strong> for the selected users.
                {selectedUsers.includes(currentUserId) && (
                  <span className="block mt-2 text-orange-600">
                    Note: Your own role will not be changed.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBulkProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkRoleChange}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={isBulkProcessing}
              >
                {isBulkProcessing ? 'Updating...' : 'Change Roles'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
