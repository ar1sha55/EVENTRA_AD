import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
    Calendar, 
    MapPin, 
    FileText, 
    Users, 
    DollarSign, 
    Image as ImageIcon,
    QrCode,
    AlertCircle,
    Upload,
    X,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

interface Event {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    capacity?: number;
    fee?: number | null;
    status: 'draft' | 'published' | 'archived';
    image_path?: string;
    qr_code_path?: string;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
}

interface FormErrors {
    [key: string]: string;
}

export default function EventFormModal({ isOpen, onClose, event }: ModalProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>('basic');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        location: '',
        capacity: 0,
        fee: null as number | null,
        status: 'draft' as 'draft' | 'published' | 'archived',
        image: null as File | null,
        qr_code_image: null as File | null,
    });

    const [preview, setPreview] = useState<string | null>(null);
    const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [dragActive, setDragActive] = useState(false);
    const [qrDragActive, setQrDragActive] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const qrCodeFileInputRef = useRef<HTMLInputElement>(null);

    // Fee presets for quick selection
    const feePresets = [
        { label: 'Free', value: 0 },
        { label: 'RM 5', value: 5 },
        { label: 'RM 10', value: 10 },
        { label: 'RM 20', value: 20 },
        { label: 'RM 50', value: 50 },
    ];

    // Helper function to format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateTimeLocal = (date: Date | string) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Initialize form data when modal opens or event changes
    // This is a valid use case for setState in useEffect for form initialization
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        if (isOpen) {
            if (event) {
                // Properly format dates from event for datetime-local input
                // Handle different date formats from backend (with or without timezone, with or without space)
                const parseEventDate = (dateString: string) => {
                    // Replace space with 'T' if needed (e.g., "2025-12-01 14:00:00" -> "2025-12-01T14:00:00")
                    const normalizedDate = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
                    return formatDateTimeLocal(normalizedDate);
                };

                setFormData({
                    name: event.name,
                    description: event.description,
                    start_date: parseEventDate(event.start_date),
                    end_date: parseEventDate(event.end_date),
                    location: event.location,
                    capacity: event.capacity ?? 0,
                    fee: event.fee ?? null,
                    status: event.status,
                    image: null,
                    qr_code_image: null,
                });
                setPreview(event.image_path ? `/storage/${event.image_path}` : null);
                setQrCodePreview(event.qr_code_path ? `/storage/${event.qr_code_path}` : null);
            } else {
                // Smart defaults for new events - use current time
                const now = new Date();
                const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

                setFormData({
                    name: '',
                    description: '',
                    start_date: formatDateTimeLocal(now),
                    end_date: formatDateTimeLocal(endTime),
                    location: '',
                    capacity: 50,
                    fee: null,
                    status: 'draft',
                    image: null,
                    qr_code_image: null,
                });
                setPreview(null);
                setQrCodePreview(null);
            }
            setErrors({});
            setExpandedSection('basic');
        }
    }, [event, isOpen]);

    // Validation functions
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Event name is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'Start date is required';
        }

        if (!formData.end_date) {
            newErrors.end_date = 'End date is required';
        }

        if (formData.start_date && formData.end_date) {
            const startDate = new Date(formData.start_date);
            const endDate = new Date(formData.end_date);
            const now = new Date();
            
            if (endDate <= startDate) {
                newErrors.end_date = 'End date must be after start date';
            }

            // Prevent past dates for both create and edit
            // For edit: only prevent if the original event was in the future and user tries to change it to past
            if (event) {
                const originalStartDate = new Date(event.start_date);
                // If original event was in the future, don't allow changing to past
                if (originalStartDate >= now && startDate < now) {
                    newErrors.start_date = 'Start date cannot be changed to a past date';
                }
            } else {
                // For new events, always prevent past dates
                if (startDate < now) {
                    newErrors.start_date = 'Start date cannot be in the past';
                }
            }
        }

        if (formData.capacity < 0) {
            newErrors.capacity = 'Capacity cannot be negative';
        }

        if (formData.fee !== null && formData.fee < 0) {
            newErrors.fee = 'Fee cannot be negative';
        }

        // QR code validation for paid events
        const isPaidEvent = formData.fee !== null && formData.fee > 0;
        if (isPaidEvent && !formData.qr_code_image && !event?.qr_code_path) {
            newErrors.qr_code_image = 'QR code is required for paid events';
        }

        // Image size validation
        if (formData.image) {
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (formData.image.size > maxSize) {
                newErrors.image = 'Image size must be less than 5MB';
            }
        }

        if (formData.qr_code_image) {
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (formData.qr_code_image.size > maxSize) {
                newErrors.qr_code_image = 'QR code image size must be less than 2MB';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setProcessing(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('start_date', formData.start_date);
        data.append('end_date', formData.end_date);
        data.append('location', formData.location);
        data.append('status', formData.status);

        if (formData.capacity && formData.capacity > 0) {
            data.append('capacity', formData.capacity.toString());
        }

        if (formData.fee !== null && formData.fee !== undefined && formData.fee > 0) {
            data.append('fee', formData.fee.toString());
        } else {
            data.append('fee', '0');
        }

        if (formData.image) {
            data.append('image', formData.image);
        }

        if (formData.qr_code_image) {
            data.append('qr_code_image', formData.qr_code_image);
        }

        if (event) {
            data.append('_method', 'PUT');
        }

        const url = event ? `/events/${event.id}` : '/events';

        router.post(url, data, {
            forceFormData: true,
            onFinish: () => {
                setProcessing(false);
            },
            onSuccess: () => {
                // Close modal after success
                onClose();
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
        });
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleStartDateChange = (value: string) => {
        updateFormData('start_date', value);
        
        if (!formData.end_date || new Date(formData.end_date) <= new Date(value)) {
            const newEndDate = new Date(value);
            newEndDate.setHours(newEndDate.getHours() + 2);
            updateFormData('end_date', newEndDate.toISOString().slice(0, 16));
        }
    };

    const handleDrag = (e: React.DragEvent, type: 'image' | 'qr') => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            type === 'image' ? setDragActive(true) : setQrDragActive(true);
        } else if (e.type === "dragleave") {
            type === 'image' ? setDragActive(false) : setQrDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent, type: 'image' | 'qr') => {
        e.preventDefault();
        e.stopPropagation();
        type === 'image' ? setDragActive(false) : setQrDragActive(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileSelect(file, type);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'qr') => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file, type);
        }
    };

    const handleFileSelect = (file: File, type: 'image' | 'qr') => {
        if (type === 'image') {
            updateFormData('image', file);
            setPreview(URL.createObjectURL(file));
        } else {
            updateFormData('qr_code_image', file);
            setQrCodePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = (type: 'image' | 'qr') => {
        if (type === 'image') {
            updateFormData('image', null);
            setPreview(event?.image_path ? `/storage/${event.image_path}` : null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } else {
            updateFormData('qr_code_image', null);
            setQrCodePreview(event?.qr_code_path ? `/storage/${event.qr_code_path}` : null);
            if (qrCodeFileInputRef.current) {
                qrCodeFileInputRef.current.value = '';
            }
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const isPaidEvent = formData.fee !== null && formData.fee > 0;

    const Section = ({ 
        id, 
        title, 
        icon: Icon, 
        children, 
        hasError 
    }: { 
        id: string; 
        title: string; 
        icon: any; 
        children: React.ReactNode;
        hasError?: boolean;
    }) => {
        const isExpanded = expandedSection === id;
        
        return (
            <div className="border rounded-lg">
                <button
                    type="button"
                    onClick={() => toggleSection(id)}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors ${
                        isExpanded ? 'bg-muted/50' : ''
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{title}</span>
                        {hasError && (
                            <Badge 
                                variant="outline" 
                                className="text-xs bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center gap-1"
                            >
                                <AlertCircle className="h-3 w-3" />
                                Needs attention
                            </Badge>
                        )}
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isExpanded && (
                    <div className="p-4 border-t space-y-4">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {event ? 'Edit Event' : 'Create Event'}
                    </DialogTitle>
                    {Object.keys(errors).length > 0 && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please fix the errors before submitting
                            </AlertDescription>
                        </Alert>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3">
                    {/* Basic Information */}
                    <Section 
                        id="basic" 
                        title="Basic Information" 
                        icon={FileText}
                        hasError={!!(errors.name || errors.description || errors.location)}
                    >
                        <div>
                            <Label htmlFor="name">Event Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => updateFormData('name', e.target.value)}
                                placeholder="e.g., Beach Cleanup Day"
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => updateFormData('description', e.target.value)}
                                placeholder="Describe your event..."
                                rows={4}
                                className={errors.description ? 'border-red-500' : ''}
                            />
                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                        </div>

                        <div>
                            <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => updateFormData('location', e.target.value)}
                                placeholder="e.g., Senai Beach, Johor"
                                className={errors.location ? 'border-red-500' : ''}
                            />
                            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                        </div>
                    </Section>

                    {/* Schedule */}
                    <Section 
                        id="schedule" 
                        title="Schedule" 
                        icon={Calendar}
                        hasError={!!(errors.start_date || errors.end_date)}
                    >
                        <div>
                            <Label htmlFor="start_date">Start Date & Time <span className="text-red-500">*</span></Label>
                            <Input
                                id="start_date"
                                type="datetime-local"
                                value={formData.start_date}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                className={errors.start_date ? 'border-red-500' : ''}
                            />
                            {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                        </div>

                        <div>
                            <Label htmlFor="end_date">End Date & Time <span className="text-red-500">*</span></Label>
                            <Input
                                id="end_date"
                                type="datetime-local"
                                value={formData.end_date}
                                onChange={(e) => updateFormData('end_date', e.target.value)}
                                min={formData.start_date}
                                className={errors.end_date ? 'border-red-500' : ''}
                            />
                            {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
                        </div>
                    </Section>

                    {/* Registration */}
                    <Section 
                        id="registration" 
                        title="Registration" 
                        icon={Users}
                        hasError={!!(errors.capacity || errors.fee)}
                    >
                        <div>
                            <Label htmlFor="capacity">Capacity <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                            <Input
                                id="capacity"
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => updateFormData('capacity', parseInt(e.target.value) || 0)}
                                min="0"
                                placeholder="0 = unlimited"
                                className={errors.capacity ? 'border-red-500' : ''}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Set to 0 for unlimited capacity</p>
                            {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
                        </div>

                        <div>
                            <Label>Registration Fee <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                            <div className="flex gap-2 flex-wrap mb-2">
                                {feePresets.map((preset) => (
                                    <Button
                                        key={preset.value}
                                        type="button"
                                        variant={formData.fee === preset.value ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => updateFormData('fee', preset.value === 0 ? null : preset.value)}
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">RM</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.fee ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        updateFormData('fee', value === '' ? null : parseFloat(value));
                                    }}
                                    className={`pl-12 ${errors.fee ? 'border-red-500' : ''}`}
                                    min="0"
                                    placeholder="0.00"
                                />
                            </div>
                            {errors.fee && <p className="text-red-500 text-sm mt-1">{errors.fee}</p>}
                            {isPaidEvent && (
                                <Alert className="mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>Payment QR code required (see Media section)</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </Section>

                    {/* Media */}
                    <Section 
                        id="media" 
                        title="Media" 
                        icon={ImageIcon}
                        hasError={!!(errors.image || errors.qr_code_image)}
                    >
                        {/* Event Poster */}
                        <div>
                            <Label>Event Poster</Label>
                            <div
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                                    dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                                } ${errors.image ? 'border-red-500' : ''}`}
                                onDragEnter={(e) => handleDrag(e, 'image')}
                                onDragLeave={(e) => handleDrag(e, 'image')}
                                onDragOver={(e) => handleDrag(e, 'image')}
                                onDrop={(e) => handleDrop(e, 'image')}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'image')}
                                />
                                {preview ? (
                                    <div className="relative inline-block">
                                        <img src={preview} alt="Preview" className="max-h-48 rounded-lg" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute -top-2 -right-2"
                                            onClick={(e) => { e.stopPropagation(); removeImage('image'); }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Drag and drop or click to upload</p>
                                    </div>
                                )}
                            </div>
                            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
                        </div>

                        {/* QR Code for Paid Events */}
                        {isPaidEvent && (
                            <div className="border-t pt-4">
                                <Label>Payment QR Code <span className="text-red-500">*</span></Label>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                                        qrDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                                    } ${errors.qr_code_image ? 'border-red-500' : ''}`}
                                    onDragEnter={(e) => handleDrag(e, 'qr')}
                                    onDragLeave={(e) => handleDrag(e, 'qr')}
                                    onDragOver={(e) => handleDrag(e, 'qr')}
                                    onDrop={(e) => handleDrop(e, 'qr')}
                                    onClick={() => qrCodeFileInputRef.current?.click()}
                                >
                                    <Input
                                        ref={qrCodeFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, 'qr')}
                                    />
                                    {qrCodePreview ? (
                                        <div className="relative inline-block">
                                            <img src={qrCodePreview} alt="QR Preview" className="max-h-48 rounded-lg" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute -top-2 -right-2"
                                                onClick={(e) => { e.stopPropagation(); removeImage('qr'); }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <QrCode className="h-8 w-8 mx-auto text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">Upload payment QR code</p>
                                        </div>
                                    )}
                                </div>
                                {errors.qr_code_image && <p className="text-red-500 text-sm mt-1">{errors.qr_code_image}</p>}
                            </div>
                        )}
                    </Section>

                    {/* Publishing */}
                    <Section id="publish" title="Publishing Status" icon={AlertCircle}>
                        <div>
                            <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => updateFormData('status', value as 'draft' | 'published' | 'archived')}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Only published events are visible to members
                            </p>
                        </div>
                    </Section>
                </form>

                <DialogFooter className="mt-4 gap-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={processing}>
                        {processing ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}