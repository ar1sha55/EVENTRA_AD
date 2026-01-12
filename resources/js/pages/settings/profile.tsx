import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { Upload, X, User } from 'lucide-react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

const facultyOptions = [
    { value: 'fke', label: 'FKE - Faculty of Electrical Engineering' },
    { value: 'fkm', label: 'FKM - Faculty of Mechanical Engineering' },
    { value: 'fc', label: 'FC - Faculty of Computing' },
    { value: 'fab', label: 'FAB - Faculty of Built Environment' },
    { value: 'fka', label: 'FKA - Faculty of Chemical Engineering' },
    { value: 'fs', label: 'FS - Faculty of Science' },
    { value: 'fcee', label: 'FCEE - Faculty of Civil Engineering' },
    { value: 'fm', label: 'FM - Faculty of Management' },
    { value: 'fssh', label: 'FSSH - Faculty of Social Sciences and Humanities' },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const page = usePage<SharedData>();
    const { auth, errors: pageErrors, flash } = page.props;
    const errors = pageErrors || {};
    const isAdmin = auth.user.role === 'admin';
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle flash messages from backend (for cases like redirects)
    useEffect(() => {
        const flashData = flash as any;
        if (flashData?.success) {
            toast.success(flashData.success);
        }
        if (flashData?.error) {
            toast.error(flashData.error);
        }
    }, [flash]);

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveProfilePicture = () => {
        setProcessing(true);

        router.delete('/settings/profile/picture', {
            preserveScroll: true,
            onSuccess: () => {
                setProfilePicturePreview(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                toast.success('Profile picture removed successfully');
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat().join(', ') || 'Failed to remove profile picture.';
                toast.error('Failed to remove profile picture', {
                    description: errorMessage,
                });
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const form = e.currentTarget;
        const formData = new FormData(form);
        const email = formData.get('email') as string;
        const secondaryEmail = formData.get('secondary_email') as string;
        const phoneNumber = formData.get('phone_number') as string;

        // Validate primary email
        if (email && !email.toLowerCase().endsWith('@graduate.utm.my')) {
            toast.error('Invalid primary email', {
                description: 'Primary email must end with @graduate.utm.my',
            });
            return;
        }

        // Validate secondary email (if provided)
        if (secondaryEmail && secondaryEmail.trim() !== '' && !secondaryEmail.toLowerCase().endsWith('@gmail.com')) {
            toast.error('Invalid secondary email', {
                description: 'Secondary email must end with @gmail.com',
            });
            return;
        }

        // Validate phone number (if provided)
        if (phoneNumber && phoneNumber.trim() !== '') {
            // Remove spaces, dashes, and other formatting characters
            const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
            // Check if it starts with 0 and has 10-11 digits (Malaysian format)
            const phoneRegex = /^0\d{9,10}$/;
            if (!phoneRegex.test(cleanedPhone)) {
                toast.error('Invalid phone number', {
                    description: 'Phone number must be in format: 0123456789 (10-11 digits starting with 0)',
                });
                return;
            }
            // Update formData with cleaned phone number
            formData.set('phone_number', cleanedPhone);
        }

        setProcessing(true);
        formData.append('_method', 'PATCH');

        router.post('/settings/profile', formData, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                // Show toast immediately on success
                toast.success('Profile updated successfully!', {
                    description: 'Your profile information has been saved.',
                });
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat().join(', ') || 'Failed to update profile. Please check the form for errors.';
                toast.error('Failed to update profile', {
                    description: errorMessage,
                });
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="Update your account information and manage your profile"
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Profile Picture Section */}
                                <div className="grid gap-4">
                                    <Label>Profile Picture</Label>
                                    <div className="flex items-center gap-6">
                                        <Avatar className="h-24 w-24">
                                            <AvatarImage
                                                src={
                                                    profilePicturePreview ||
                                                    (auth.user.profile_picture
                                                        ? `/storage/${auth.user.profile_picture}`
                                                        : undefined)
                                                }
                                            />
                                            <AvatarFallback className="bg-muted">
                                                <User className="h-12 w-12 text-muted-foreground" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <Label
                                                    htmlFor="profile_picture"
                                                    className="cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                                                        <Upload className="h-4 w-4" />
                                                        <span>Upload new picture</span>
                                                    </div>
                                                </Label>
                                                {(auth.user.profile_picture || profilePicturePreview) && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={handleRemoveProfilePicture}
                                                        disabled={processing}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        <span>Remove</span>
                                                    </Button>
                                                )}
                                            </div>
                                            <Input
                                                id="profile_picture"
                                                type="file"
                                                name="profile_picture"
                                                accept="image/jpeg,image/jpg,image/png,image/gif"
                                                className="hidden"
                                                onChange={handleProfilePictureChange}
                                                ref={fileInputRef}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                JPG, PNG or GIF. Max size 2MB
                                            </p>
                                        </div>
                                    </div>
                                    <InputError message={errors.profile_picture} />
                                </div>

                                {/* Basic Information */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Full Name *</Label>
                                        <Input
                                            id="name"
                                            defaultValue={auth.user.name}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Full name"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="matric_id">
                                            Matric ID {isAdmin && '*'}
                                        </Label>
                                        <Input
                                            id="matric_id"
                                            defaultValue={auth.user.matric_id || ''}
                                            name="matric_id"
                                            disabled={!isAdmin}
                                            placeholder="Matric ID"
                                            className={!isAdmin ? 'bg-muted cursor-not-allowed' : ''}
                                        />
                                        {!isAdmin && (
                                            <p className="text-xs text-muted-foreground">
                                                Only admin can modify this field
                                            </p>
                                        )}
                                        <InputError message={errors.matric_id} />
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Primary Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            defaultValue={auth.user.email}
                                            name="email"
                                            required
                                            autoComplete="username"
                                            placeholder="example@graduate.utm.my"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Must end with @graduate.utm.my
                                        </p>
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="secondary_email">Secondary Email</Label>
                                        <Input
                                            id="secondary_email"
                                            type="email"
                                            defaultValue={auth.user.secondary_email || ''}
                                            name="secondary_email"
                                            autoComplete="email"
                                            placeholder="example@gmail.com"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Must end with @gmail.com (optional)
                                        </p>
                                        <InputError message={errors.secondary_email} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="phone_number">Phone Number</Label>
                                    <Input
                                        id="phone_number"
                                        type="tel"
                                        defaultValue={auth.user.phone_number || ''}
                                        name="phone_number"
                                        autoComplete="tel"
                                        placeholder="0123456789"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Format: 0123456789 (10-11 digits starting with 0)
                                    </p>
                                    <InputError message={errors.phone_number} />
                                </div>

                                {/* Personal Information */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Input
                                            id="gender"
                                            defaultValue={
                                                auth.user.gender
                                                    ? auth.user.gender.charAt(0).toUpperCase() +
                                                      auth.user.gender.slice(1)
                                                    : 'Not specified'
                                            }
                                            disabled
                                            className="bg-muted cursor-not-allowed"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Cannot be modified
                                        </p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="nationality">Nationality</Label>
                                        <Input
                                            id="nationality"
                                            defaultValue={
                                                auth.user.nationality
                                                    ? auth.user.nationality.charAt(0).toUpperCase() +
                                                      auth.user.nationality.slice(1)
                                                    : 'Not specified'
                                            }
                                            disabled
                                            className="bg-muted cursor-not-allowed"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Cannot be modified
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="faculty">
                                        Faculty {isAdmin && '*'}
                                    </Label>
                                    {isAdmin ? (
                                        <Select name="faculty" defaultValue={auth.user.faculty || ''}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select faculty" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {facultyOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <>
                                            <Input
                                                id="faculty"
                                                defaultValue={
                                                    auth.user.faculty
                                                        ? facultyOptions.find(
                                                              (f) => f.value === auth.user.faculty,
                                                          )?.label || auth.user.faculty.toUpperCase()
                                                        : 'Not specified'
                                                }
                                                disabled
                                                className="bg-muted cursor-not-allowed"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Only admin can modify this field
                                            </p>
                                        </>
                                    )}
                                    <InputError message={errors.faculty} />
                                </div>

                                {mustVerifyEmail && auth.user.email_verified_at === null && (
                                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 p-4">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="font-medium underline decoration-yellow-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current dark:decoration-yellow-600"
                                            >
                                                Click here to resend the verification email.
                                            </Link>
                                        </p>

                                        {status === 'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                                                A new verification link has been sent to your email
                                                address.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pt-4">
                                    <Button disabled={processing} data-test="update-profile-button">
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>

                                    <Transition
                                        show={status === 'profile-updated'}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                            Profile updated successfully!
                                        </p>
                                    </Transition>
                                </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
