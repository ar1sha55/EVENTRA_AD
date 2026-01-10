import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
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
  Mail,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  Info,
  GraduationCap,
  Lock,
  CheckSquare,
  Square,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TablePagination } from "@/components/ui/table-pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { usePagination } from "@/hooks/usePagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import InputError from "@/components/input-error";

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

  // Sorting state
  type SortField = 'name' | 'email' | 'matric_id' | 'faculty' | 'created_at';
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  // Bulk selection state
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Form errors state - Laravel returns errors as arrays, so we handle both string and string[]
  const [errors, setErrors] = useState<Record<string, string | string[]>>({});

  // Helper function to get error message (handles both string and array)
  const getErrorMessage = (field: string): string | undefined => {
    const error = errors[field];
    if (!error) return undefined;
    if (Array.isArray(error)) {
      return error[0]; // Return first error message
    }
    return error;
  };

  // Helper function to clear a specific error field
  const clearError = (field: string) => {
    if (errors[field]) {
      const { [field]: removed, ...restErrors } = errors;
      setErrors(restErrors);
    }
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

  // Client-side validation errors state
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  // Filter and sort members using useMemo (client-side - instant and responsive)
  const filteredMembers = useMemo(() => {
    let filtered = [...members];

    // Apply search filter (case-insensitive)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.matric_id.toLowerCase().includes(query)
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
        case 'faculty':
          aValue = (a.faculty || '').toLowerCase();
          bValue = (b.faculty || '').toLowerCase();
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
  }, [members, searchQuery, sortField, sortDirection]);

  // Pagination using the usePagination hook
  const {
    paginatedData: paginatedMembers,
    currentPage,
    totalPages,
    itemsPerPage,
    setPage,
    setItemsPerPage,
    resetPage,
    showingFrom,
    showingTo,
    totalItems,
  } = usePagination({ data: filteredMembers, initialItemsPerPage: 25 });

  // Reset to page 1 when filters change
  useEffect(() => {
    resetPage();
  }, [searchQuery, sortField, sortDirection, resetPage]);

  // Clear selection when filters change (but not when page changes)
  useEffect(() => {
    setSelectedMembers([]);
  }, [searchQuery]);

  // Handle flash messages with toast
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    } else if (flash?.error) {
      toast.error(flash.error);
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
    setErrors({}); // Clear errors when resetting form
    setClientErrors({}); // Clear client-side validation errors
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

    // Clear previous errors
    setErrors({});
    setClientErrors({});

    // Validate phone number client-side
    const phoneError = validatePhoneNumber(form.phone_number);
    if (phoneError) {
      setClientErrors({ phone_number: phoneError });
      toast.error('Please fix the validation errors before submitting.');
      return;
    }

    const postData = {
        ...form,
    };

    if (editingMember) {
      router.post(`/manager/members/${editingMember.id}`, {
        _method: 'PUT',
        ...postData,
      }, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Member updated successfully!');
          resetForm();
        },
        onError: (pageErrors) => {
          // Capture validation errors from backend
          setErrors(pageErrors || {});
          toast.error('Failed to update member. Please check the form for errors.');
        },
      });
    } else {
      router.post('/manager/members', postData, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Member added successfully!');
          resetForm();
        },
        onError: (pageErrors) => {
          // Capture validation errors from backend
          setErrors(pageErrors || {});
          toast.error('Failed to add member. Please check the form for errors.');
        },
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
        onSuccess: () => {
          toast.success('Member deleted successfully!');
          setDeletingMember(null);
        },
        onError: () => {
          toast.error('Failed to delete member.');
          setDeletingMember(null);
        },
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
      toast.error('Please fill in all email fields.');
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
        onSuccess: () => {
          toast.success('Email sent successfully!');
          handleCloseEmailDialog();
        },
        onError: () => {
          toast.error('Failed to send email.');
        },
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

  // Bulk selection handlers - works on CURRENT PAGE only (standard behavior)
  const handleSelectAll = () => {
    const currentPageMemberIds = paginatedMembers.map(m => m.id);
    const allCurrentPageSelected = currentPageMemberIds.every(id => selectedMembers.includes(id));

    if (allCurrentPageSelected) {
      // Deselect all members on current page
      setSelectedMembers(prev => prev.filter(id => !currentPageMemberIds.includes(id)));
    } else {
      // Select all members on current page (add to existing selection)
      setSelectedMembers(prev => [...new Set([...prev, ...currentPageMemberIds])]);
    }
  };

  const handleSelectMember = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Check if all members on CURRENT PAGE are selected
  const isAllCurrentPageSelected = paginatedMembers.length > 0 &&
    paginatedMembers.every(m => selectedMembers.includes(m.id));

  // Check if some (but not all) members on current page are selected
  const isSomeCurrentPageSelected = paginatedMembers.some(m => selectedMembers.includes(m.id)) &&
    !isAllCurrentPageSelected;

  const handleBulkDelete = () => {
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member to delete.");
      return;
    }
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    setIsBulkProcessing(true);
    router.post('/manager/members/bulk-delete', {
      member_ids: selectedMembers,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`${selectedMembers.length} member(s) deleted successfully!`);
        setSelectedMembers([]);
        setShowBulkDeleteDialog(false);
        setIsBulkProcessing(false);
      },
      onError: () => {
        toast.error('Failed to delete members.');
        setIsBulkProcessing(false);
      }
    });
  };

  const clearSelection = () => {
    setSelectedMembers([]);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manage Members" />

      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Manage Members</h1>
              <p className="text-muted-foreground">
                View and manage all registered members
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Add Member button clicked!", { isAdding });
              if (isAdding) {
                console.log("Resetting form...");
                resetForm();
              } else {
                console.log("Setting isAdding to true...");
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

        {/* Add/Edit Member Form Modal */}
        <Dialog open={isAdding} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingMember ? "Edit Member" : "Add New Member"}
              </DialogTitle>
              <DialogDescription>
                {editingMember
                  ? "Update the member information below."
                  : "Fill in the details to add a new member."}
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
                              onChange={(e) => {
                                handleFileChange(e);
                                clearError('profile_picture');
                              }}
                              accept="image/*"
                              className="hidden"
                              aria-invalid={!!errors.profile_picture}
                            />
                            <span className={`text-sm flex-1 ${errors.profile_picture ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {form.profile_picture ? form.profile_picture.name : preview && editingMember ? 'Current image' : 'No file chosen'}
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
                        value={form.name}
                        onChange={(e) => {
                          setForm({ ...form, name: e.target.value });
                          clearError('name');
                        }}
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
                        aria-invalid={!!errors.name}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      <InputError message={getErrorMessage('name')} className="mt-1" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="matric_id">Matric ID *</Label>
                      <Input
                        id="matric_id"
                        value={form.matric_id}
                        onChange={(e) => {
                          setForm({ ...form, matric_id: e.target.value });
                          clearError('matric_id');
                        }}
                        placeholder="e.g., A23CS0135"
                        required
                        aria-invalid={!!errors.matric_id}
                        className={errors.matric_id ? 'border-destructive' : ''}
                      />
                      <InputError message={getErrorMessage('matric_id')} className="mt-1" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={form.gender} 
                        onValueChange={(value) => {
                          setForm({ ...form, gender: value });
                          clearError('gender');
                        }}
                      >
                        <SelectTrigger 
                          className={errors.gender ? 'border-destructive' : ''}
                          aria-invalid={!!errors.gender}
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
                        value={form.email}
                        onChange={(e) => {
                          setForm({ ...form, email: e.target.value });
                          clearError('email');
                        }}
                        placeholder="name@graduate.utm.my"
                        required
                        aria-invalid={!!errors.email}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      <InputError message={getErrorMessage('email')} className="mt-1" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        value={form.phone_number}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm({ ...form, phone_number: value });
                          clearError('phone_number');
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
                        aria-invalid={!!(errors.phone_number || clientErrors.phone_number)}
                        className={(errors.phone_number || clientErrors.phone_number) ? 'border-destructive' : ''}
                      />
                      <InputError 
                        message={getErrorMessage('phone_number') || clientErrors.phone_number} 
                        className="mt-1" 
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional: 10-13 digits
                      </p>
                    </div>

                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="secondary_email">Secondary Email</Label>
                      <Input
                        id="secondary_email"
                        type="email"
                        value={form.secondary_email}
                        onChange={(e) => {
                          setForm({ ...form, secondary_email: e.target.value });
                          clearError('secondary_email');
                        }}
                        placeholder="personal@email.com"
                        aria-invalid={!!errors.secondary_email}
                        className={errors.secondary_email ? 'border-destructive' : ''}
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
                        value={form.faculty} 
                        onValueChange={(value) => {
                          setForm({ ...form, faculty: value });
                          clearError('faculty');
                        }}
                      >
                        <SelectTrigger 
                          className={errors.faculty ? 'border-destructive' : ''}
                          aria-invalid={!!errors.faculty}
                        >
                          <SelectValue placeholder="Select faculty">
                            {form.faculty && form.faculty.toUpperCase()}
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
                        value={form.nationality} 
                        onValueChange={(value) => {
                          setForm({ ...form, nationality: value });
                          clearError('nationality');
                        }}
                      >
                        <SelectTrigger 
                          className={errors.nationality ? 'border-destructive' : ''}
                          aria-invalid={!!errors.nationality}
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

                {/* Password */}
                <div className="space-y-4 pb-6 border-t pt-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    {editingMember ? "Change Password (Optional)" : "Password *"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password {!editingMember && "*"}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => {
                          setForm({ ...form, password: e.target.value });
                          clearError('password');
                        }}
                        placeholder="Enter password"
                        required={!editingMember}
                        aria-invalid={!!errors.password}
                        className={errors.password ? 'border-destructive' : ''}
                      />
                      <InputError message={getErrorMessage('password')} className="mt-1" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password_confirmation">Confirm Password {!editingMember && "*"}</Label>
                      <Input
                        id="password_confirmation"
                        type="password"
                        value={form.password_confirmation}
                        onChange={(e) => {
                          setForm({ ...form, password_confirmation: e.target.value });
                          clearError('password_confirmation');
                        }}
                        placeholder="Confirm password"
                        required={!editingMember}
                        aria-invalid={!!errors.password_confirmation}
                        className={errors.password_confirmation ? 'border-destructive' : ''}
                      />
                      <InputError message={getErrorMessage('password_confirmation')} className="mt-1" />
                    </div>
                  </div>
                  {editingMember && (
                    <p className="text-xs text-muted-foreground">Leave blank to keep current password</p>
                  )}
                </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                <Button type="button" variant="outline" onClick={resetForm} size="lg">
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700" size="lg">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {editingMember ? "Update Member" : "Add Member"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Members List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Member List ({filteredMembers.length})</CardTitle>
                  <CardDescription>
                    {filteredMembers.length === members.length
                      ? 'Manage registered members for your events'
                      : `Showing ${filteredMembers.length} of ${members.length} members`}
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
                          placeholder="Search members by name, email, or matric ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {searchQuery && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">Active filters:</span>
                      <Badge variant="secondary" className="gap-1">
                        Search: "{searchQuery}"
                        <button
                          onClick={() => setSearchQuery('')}
                          className="ml-1 hover:text-foreground"
                        >
                          ×
                        </button>
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="h-6 text-xs"
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Select All Pages Banner */}
              {isAllCurrentPageSelected && selectedMembers.length < filteredMembers.length && (
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="py-2.5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="text-sm text-blue-900 dark:text-blue-100">
                          All <strong>{paginatedMembers.length}</strong> members on this page are selected.
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMembers(filteredMembers.map(m => m.id))}
                        className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-200 h-8"
                      >
                        Select all {filteredMembers.length} members
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bulk Action Bar */}
              {selectedMembers.length > 0 && (
                <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      {/* Left: Selection Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <CheckSquare className="h-5 w-5 text-orange-600 flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-orange-900 dark:text-orange-100 text-sm">
                            {selectedMembers.length === filteredMembers.length ? (
                              `All ${selectedMembers.length} filtered member${selectedMembers.length > 1 ? 's' : ''} selected`
                            ) : selectedMembers.length > paginatedMembers.length ? (
                              `${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} selected across pages`
                            ) : (
                              `${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} selected`
                            )}
                          </span>
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

                        {/* Primary Action: Delete */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete ({selectedMembers.length})
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                      <th className="px-4 py-3 text-left font-semibold w-10">
                        <Checkbox
                          checked={isAllCurrentPageSelected}
                          onCheckedChange={handleSelectAll}
                          className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                          aria-label="Select all members on current page"
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
                        field="faculty"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="text-left"
                      >
                        Faculty
                      </SortableTableHead>
                      <SortableTableHead
                        field="created_at"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="text-center"
                      >
                        Date Joined
                      </SortableTableHead>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMembers.map((member) => (
                      <tr
                        key={member.id}
                        className={`border-b hover:bg-muted/50 transition-colors ${
                          selectedMembers.includes(member.id) ? 'bg-orange-50 dark:bg-orange-950/20' : ''
                        }`}
                      >
                        <td className="px-4 py-2">
                          <Checkbox
                            checked={selectedMembers.includes(member.id)}
                            onCheckedChange={() => handleSelectMember(member.id)}
                            className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                          />
                        </td>
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

                {/* Pagination controls */}
                {filteredMembers.length > 0 && (
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

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedMembers.length} Members?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{selectedMembers.length}</strong> selected member{selectedMembers.length > 1 ? 's' : ''} and all their associated data.
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
                {isBulkProcessing ? 'Deleting...' : `Delete ${selectedMembers.length} Members`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AppLayout>
  );
}