import AppLayout from "@/layouts/app-layout";
import { Head, router, usePage, useForm } from "@inertiajs/react";
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
  RefreshCw,
  Info,
  GraduationCap,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton, StatCardsGridSkeleton } from "@/components/ui/loading-skeletons";
import { Checkbox } from "@/components/ui/checkbox";
import { TablePagination } from "@/components/ui/table-pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { usePagination } from "@/hooks/usePagination";
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
import InputError from "@/components/input-error";

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
  const page = usePage();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'member'>('all');
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Sorting state
  type SortField = 'name' | 'email' | 'matric_id' | 'role' | 'created_at';
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Use Inertia's useForm hook for proper form handling
  const { data, setData, post, put, reset, processing, errors, transform } = useForm({
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

  // Transform to handle optional password in edit mode
  transform((data) => {
    const payload: any = { ...data };

    // Only include password fields if password is provided
    if (!data.password || data.password.trim() === '') {
      delete payload.password;
      delete payload.password_confirmation;
    }

    return payload;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Client-side validation errors state
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  // Helper function to get error message (handles both string and array from Inertia)
  const getErrorMessage = (field: string): string | undefined => {
    // Check client-side errors first
    if (clientErrors[field]) {
      return clientErrors[field];
    }
    // Then check Inertia errors - use type assertion for dynamic field access
    const error = (errors as Record<string, string | string[] | undefined>)[field];
    if (!error) return undefined;
    if (Array.isArray(error)) {
      return error[0]; // Return first error message
    }
    return error;
  };

  // Phone number validation function
  const validatePhoneNumber = (phone: string): string | undefined => {
    if (!phone || phone.trim() === '') {
      return undefined; // Phone number is optional
    }

    // Remove common formatting characters (spaces, dashes, parentheses, plus sign)
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // Check if it contains only digits
    if (!/^\d+$/.test(cleaned)) {
      return 'Phone number must contain only digits and common formatting characters (+, -, spaces)';
    }

    // Check length (10-13 digits after cleaning)
    if (cleaned.length < 10 || cleaned.length > 13) {
      return 'Phone number must be between 10 and 13 digits';
    }

    return undefined; // Valid
  };


  // Track page loading state for skeleton display during navigation
  useEffect(() => {
    const handleStart = () => setIsPageLoading(true);
    const handleFinish = () => setIsPageLoading(false);

    router.on('start', handleStart);
    router.on('finish', handleFinish);

    return () => {
      router.on('start', handleStart);
      router.on('finish', handleFinish);
    };
  }, []);

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

    // Dynamic sorting based on sortField and sortDirection
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'matric_id':
          aValue = a.matric_id.toLowerCase();
          bValue = b.matric_id.toLowerCase();
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, roleFilter, searchQuery, sortField, sortDirection]);

  // Pagination using the usePagination hook
  const {
    paginatedData: paginatedUsers,
    currentPage,
    totalPages,
    itemsPerPage,
    setPage,
    setItemsPerPage,
    resetPage,
    showingFrom,
    showingTo,
    totalItems,
  } = usePagination({ data: filteredUsers, initialItemsPerPage: 25 });

  // Reset to page 1 when filters change
  useEffect(() => {
    resetPage();
  }, [searchQuery, roleFilter, sortField, sortDirection, resetPage]);

  // Handle flash messages with toast
  useEffect(() => {
    const flash = page.props.flash as any;

    if (flash?.success) {
      toast.success(flash.success);
    } else if (flash?.error) {
      toast.error(flash.error);
    }
  }, [page.props.flash]);

  // Clear selection when filters change (but not when page changes)
  useEffect(() => {
    setSelectedUsers([]);
  }, [searchQuery, roleFilter]);

  const resetForm = () => {
    reset(); // Use Inertia's reset method
    setEditingUser(null);
    setIsAdding(false);
    setPreview(null);
    setClientErrors({}); // Clear client-side validation errors
  };

  const handleResetFilter = () => {
    setSearchQuery('');
    setRoleFilter('all');
  };

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending as default
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Clear previous client-side errors
    setClientErrors({});

    // Validate phone number client-side
    const phoneError = validatePhoneNumber(data.phone_number);
    if (phoneError) {
      setClientErrors({ phone_number: phoneError });
      toast.error('Please fix the validation errors before submitting.');
      return;
    }

    if (editingUser) {
      put(`/admin/users/${editingUser.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('User updated successfully!');
          resetForm();
        },
        onError: () => {
          toast.error('Failed to update user. Please check the form for errors.');
        },
      });
    } else {
      post('/admin/users', {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('User added successfully!');
          resetForm();
        },
        onError: () => {
          toast.error('Failed to add user. Please check the form for errors.');
        },
      });
    }
  };

  const handleEdit = (user: User) => {
    setData({
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
    setData('profile_picture' as any, file);
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
        onSuccess: () => {
          toast.success('User deleted successfully!');
          setDeletingUser(null);
        },
        onError: () => {
          toast.error('Failed to delete user.');
          setDeletingUser(null);
        },
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

  // Bulk selection handlers - works on CURRENT PAGE only (standard behavior)
  const handleSelectAll = () => {
    const currentPageUserIds = paginatedUsers.map(u => u.id);
    const allCurrentPageSelected = currentPageUserIds.every(id => selectedUsers.includes(id));

    if (allCurrentPageSelected) {
      // Deselect all users on current page
      setSelectedUsers(prev => prev.filter(id => !currentPageUserIds.includes(id)));
    } else {
      // Select all users on current page (add to existing selection)
      setSelectedUsers(prev => [...new Set([...prev, ...currentPageUserIds])]);
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Check if all users on CURRENT PAGE are selected
  const isAllCurrentPageSelected = paginatedUsers.length > 0 &&
    paginatedUsers.every(u => selectedUsers.includes(u.id));

  // Check if some (but not all) users on current page are selected
  const isSomeCurrentPageSelected = paginatedUsers.some(u => selectedUsers.includes(u.id)) &&
    !isAllCurrentPageSelected;

  // Get current user ID to prevent self-actions
  const currentUserId = (page.props as any).auth?.user?.id;

  // Filter out current user from selection for delete operations
  const selectedUsersForDelete = selectedUsers.filter(id => id !== currentUserId);

  const handleBulkDelete = () => {
    if (selectedUsersForDelete.length === 0) {
      toast.error("Cannot delete: You cannot delete your own account.");
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
        toast.success(`${selectedUsersForDelete.length} user(s) deleted successfully!`);
        setSelectedUsers([]);
        setShowBulkDeleteDialog(false);
        setIsBulkProcessing(false);
      },
      onError: () => {
        toast.error('Failed to delete users.');
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
    const userIdsToUpdate = selectedUsers.filter(id => id !== currentUserId);
    router.post('/admin/users/bulk-role', {
      user_ids: userIdsToUpdate,
      role: bulkNewRole,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`Role changed to '${bulkNewRole}' for ${userIdsToUpdate.length} user(s)!`);
        setSelectedUsers([]);
        setShowBulkRoleDialog(false);
        setIsBulkProcessing(false);
      },
      onError: () => {
        toast.error('Failed to update user roles.');
        setIsBulkProcessing(false);
      }
    });
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Manage Users', href: '/admin/manage-users' }]}>
      <Head title="Manage Users" />

      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Manage Users</h1>
              <p className="text-muted-foreground">
                Manage all users including admins, managers, and members
              </p>
            </div>
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

        {/* Add/Edit User Form Modal */}
        <Dialog open={isAdding} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingUser ? "Edit User" : "Add New User"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Update the user information below."
                  : "Fill in the details to add a new user."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                {/* Profile Picture */}
                <div className="space-y-4 pb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-primary" />
                    Profile Picture
                  </h3>
                  <div className="flex items-start gap-6">
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background shadow-lg">
                      {preview ? (
                        <img src={preview} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-16 h-16 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="profile_picture">Upload Image</Label>
                      <div className="flex items-center gap-3">
                        <label htmlFor="profile_picture" className="cursor-pointer inline-flex items-center justify-center h-8 px-6 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                          Choose File
                        </label>
                        <Input
                          id="profile_picture"
                          type="file"
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <span className={`text-sm flex-1 ${getErrorMessage('profile_picture') ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {data.profile_picture && typeof data.profile_picture === 'object' && 'name' in data.profile_picture ? (data.profile_picture as File).name : preview && editingUser ? 'Current image' : 'No file chosen'}
                        </span>
                      </div>
                      <InputError message={getErrorMessage('profile_picture')} className="mt-1" />
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB. Recommended: Square image for best results.</p>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-4 pb-6 border-t pt-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        onFocus={(e) => {
                          // Move cursor to end instead of selecting all text
                          const input = e.target;
                          const length = input.value.length;
                          setTimeout(() => {
                            input.setSelectionRange(length, length);
                          }, 0);
                        }}
                        placeholder="Enter full name"
                        required
                        autoFocus={false}
                        aria-invalid={!!getErrorMessage('name')}
                        className={getErrorMessage('name') ? 'border-destructive' : ''}
                      />
                      <InputError message={getErrorMessage('name')} className="mt-1" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="matric_id">Matric ID *</Label>
                      <Input
                        id="matric_id"
                        value={data.matric_id}
                        onChange={(e) => setData('matric_id', e.target.value)}
                        placeholder="e.g., A23CS0135"
                        required
                        aria-invalid={!!getErrorMessage('matric_id')}
                        className={getErrorMessage('matric_id') ? 'border-destructive' : ''}
                      />
                      <InputError message={getErrorMessage('matric_id')} className="mt-1" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={data.gender} 
                        onValueChange={(value) => setData('gender', value)}
                      >
                        <SelectTrigger
                          className={getErrorMessage('gender') ? 'border-destructive' : ''}
                          aria-invalid={!!getErrorMessage('gender')}
                        >
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <InputError message={getErrorMessage('gender')} className="mt-1" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email">Primary Email (UTM) *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="name@graduate.utm.my"
                        required
                        aria-invalid={!!getErrorMessage('email')}
                        className={getErrorMessage('email') ? 'border-destructive' : ''}
                      />
                      <InputError message={getErrorMessage('email')} className="mt-1" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        value={data.phone_number}
                        onChange={(e) => {
                          setData('phone_number', e.target.value);
                          // Clear client-side error when user starts typing
                          if (clientErrors.phone_number) {
                            setClientErrors({ ...clientErrors, phone_number: '' });
                          }
                        }}
                        onBlur={(e) => {
                          // Validate on blur
                          const phoneError = validatePhoneNumber(e.target.value);
                          if (phoneError) {
                            setClientErrors({ ...clientErrors, phone_number: phoneError });
                          } else {
                            const { phone_number, ...rest } = clientErrors;
                            setClientErrors(rest);
                          }
                        }}
                        placeholder="e.g. 0123456789"
                        aria-invalid={!!getErrorMessage('phone_number')}
                        className={getErrorMessage('phone_number') ? 'border-destructive' : ''}
                      />
                      <InputError message={getErrorMessage('phone_number')} className="mt-1" />
                      <p className="text-xs text-muted-foreground">
                        Optional: 10-13 digits
                      </p>
                    </div>

                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="secondary_email">Secondary Email</Label>
                      <Input
                        id="secondary_email"
                        type="email"
                        value={data.secondary_email}
                        onChange={(e) => setData('secondary_email', e.target.value)}
                        placeholder="personal@email.com"
                        aria-invalid={!!getErrorMessage('secondary_email')}
                        className={getErrorMessage('secondary_email') ? 'border-destructive' : ''}
                      />
                      <InputError message={getErrorMessage('secondary_email')} className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4 pb-6 border-t pt-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Academic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="faculty">Faculty</Label>
                      <Select 
                        value={data.faculty} 
                        onValueChange={(value) => setData('faculty', value)}
                      >
                        <SelectTrigger
                          className={getErrorMessage('faculty') ? 'border-destructive' : ''}
                          aria-invalid={!!getErrorMessage('faculty')}
                        >
                          <SelectValue placeholder="Select faculty">
                            {data.faculty && data.faculty.toUpperCase()}
                          </SelectValue>
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
                      <InputError message={getErrorMessage('faculty')} className="mt-1" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Select 
                        value={data.nationality} 
                        onValueChange={(value) => setData('nationality', value)}
                      >
                        <SelectTrigger
                          className={getErrorMessage('nationality') ? 'border-destructive' : ''}
                          aria-invalid={!!getErrorMessage('nationality')}
                        >
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
                      <InputError message={getErrorMessage('nationality')} className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-4 pb-6 border-t pt-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    User Role *
                  </h3>
                  <div className="space-y-2 max-w-md">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={data.role} 
                      onValueChange={(value) => setData('role', value)} 
                      required
                    >
                      <SelectTrigger 
                        className={`w-full ${getErrorMessage('role') ? 'border-destructive' : ''}`}
                        aria-invalid={!!getErrorMessage('role')}
                      >
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Member - Can participate in events
                          </div>
                        </SelectItem>
                        <SelectItem value="manager">
                          <div className="flex items-center gap-2">
                            <UserCog className="h-4 w-4" />
                            Manager - Can manage events and members
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin - Full system access
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={getErrorMessage('role')} className="mt-1" />
                    <p className="text-xs text-muted-foreground">
                      Select the appropriate role based on the user's responsibilities.
                    </p>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-4 pb-6 border-t pt-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    {editingUser ? "Change Password (Optional)" : "Password *"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password {!editingUser && "*"}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Enter password"
                        required={!editingUser}
                        aria-invalid={!!getErrorMessage('password')}
                        className={getErrorMessage('password') ? 'border-destructive' : ''}
                      />
                      <InputError message={getErrorMessage('password')} className="mt-1" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password_confirmation">Confirm Password {!editingUser && "*"}</Label>
                      <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="Confirm password"
                        required={!editingUser}
                        aria-invalid={!!getErrorMessage('password_confirmation')}
                        className={getErrorMessage('password_confirmation') ? 'border-destructive' : ''}
                      />
                      <InputError message={getErrorMessage('password_confirmation')} className="mt-1" />
                    </div>
                  </div>
                  {editingUser && (
                    <p className="text-xs text-muted-foreground">Leave blank to keep current password</p>
                  )}
                </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                <Button type="button" variant="outline" onClick={resetForm} size="lg">
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700" size="lg" disabled={processing}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {processing ? 'Saving...' : (editingUser ? "Update User" : "Add User")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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

              {/* Select All Pages Banner */}
              {isAllCurrentPageSelected && selectedUsers.length < filteredUsers.length && (
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="py-2.5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="text-sm text-blue-900 dark:text-blue-100">
                          All <strong>{paginatedUsers.length}</strong> users on this page are selected.
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUsers(filteredUsers.map(u => u.id))}
                        className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-200 h-8"
                      >
                        Select all {filteredUsers.length} users
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bulk Action Bar */}
              {selectedUsers.length > 0 && (
                <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      {/* Left: Selection Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <CheckSquare className="h-5 w-5 text-orange-600 flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-orange-900 dark:text-orange-100 text-sm">
                            {selectedUsers.length === filteredUsers.length ? (
                              `All ${selectedUsers.length} filtered user${selectedUsers.length > 1 ? 's' : ''} selected`
                            ) : selectedUsers.length > paginatedUsers.length ? (
                              `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected across pages`
                            ) : (
                              `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected`
                            )}
                          </span>
                          {selectedUsers.includes(currentUserId) && (
                            <span className="text-xs text-orange-700 dark:text-orange-300">
                              Your account won't be affected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSelection}
                          className="text-orange-700 hover:text-orange-900 hover:bg-orange-100 dark:hover:bg-orange-900 dark:text-orange-200"
                        >
                          Clear
                        </Button>

                        {/* Separator */}
                        <div className="h-6 w-px bg-orange-200 dark:bg-orange-700" />

                        {/* More Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <MoreHorizontal className="h-4 w-4" />
                              More
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change role to</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setBulkNewRole('member');
                              setShowBulkRoleDialog(true);
                            }}>
                              <UserIcon className="h-4 w-4 mr-2 text-green-600" />
                              Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setBulkNewRole('manager');
                              setShowBulkRoleDialog(true);
                            }}>
                              <UserCog className="h-4 w-4 mr-2 text-blue-600" />
                              Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setBulkNewRole('admin');
                              setShowBulkRoleDialog(true);
                            }}>
                              <Shield className="h-4 w-4 mr-2 text-red-600" />
                              Admin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Primary Action: Delete */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                          className="gap-2"
                          disabled={selectedUsersForDelete.length === 0}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete {selectedUsersForDelete.length > 0 && `(${selectedUsersForDelete.length})`}
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
                          checked={isAllCurrentPageSelected}
                          onCheckedChange={handleSelectAll}
                          className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                          aria-label="Select all users on current page"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold w-12">Profile</th>
                      <SortableTableHead
                        field="name"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="text-left"
                      >
                        Name
                      </SortableTableHead>
                      <SortableTableHead
                        field="email"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="text-left"
                      >
                        Email
                      </SortableTableHead>
                      <SortableTableHead
                        field="matric_id"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="text-left"
                      >
                        Matric ID
                      </SortableTableHead>
                      <SortableTableHead
                        field="role"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="text-left"
                      >
                        Role
                      </SortableTableHead>
                      <SortableTableHead
                        field="created_at"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="text-center"
                      >
                        Joined
                      </SortableTableHead>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
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

                {/* Pagination controls */}
                {filteredUsers.length > 0 && (
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    showingFrom={showingFrom}
                    showingTo={showingTo}
                    onPageChange={setPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                )}
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
