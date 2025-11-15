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
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
}

export default function EventFormModal({ isOpen, onClose, event }: ModalProps) {
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
    });

    const [preview, setPreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (event) {
                setFormData({
                    name: event.name,
                    description: event.description,
                    start_date: event.start_date.slice(0, 16),
                    end_date: event.end_date.slice(0, 16),
                    location: event.location,
                    capacity: event.capacity ?? 0,
                    fee: event.fee ?? null,
                    status: event.status,
                    image: null,
                });
                setPreview(event.image_path ? `/storage/${event.image_path}` : null);
            } else {
                setFormData({
                    name: '',
                    description: '',
                    start_date: '',
                    end_date: '',
                    location: '',
                    capacity: 0,
                    fee: null,
                    status: 'draft',
                    image: null,
                });
                setPreview(null);
            }
            setErrors({});
        }
    }, [event, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Create FormData for file upload support
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('start_date', formData.start_date);
        data.append('end_date', formData.end_date);
        data.append('location', formData.location);
        data.append('status', formData.status);

        // Only append capacity if it's greater than 0
        if (formData.capacity && formData.capacity > 0) {
            data.append('capacity', formData.capacity.toString());
        }

        // Only append fee if it's set
        if (formData.fee !== null && formData.fee !== undefined) {
            data.append('fee', formData.fee.toString());
        }

        // Append image if selected
        if (formData.image) {
            data.append('image', formData.image);
        }

        // For updates, add _method field for Laravel
        if (event) {
            data.append('_method', 'PUT');
        }

        const url = event ? `/events/${event.id}` : '/events';

        router.post(url, data, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setProcessing(false);
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
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{event ? 'Edit Event' : 'Create Event'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div>
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => updateFormData('name', e.target.value)}
                                required
                            />
                            {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                        </div>

                        <div>
                            <Label htmlFor="location">Location *</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => updateFormData('location', e.target.value)}
                                required
                            />
                            {errors.location && <div className="text-red-500 text-sm mt-1">{errors.location}</div>}
                        </div>

                        <div>
                            <Label htmlFor="start_date">Start Date *</Label>
                            <Input
                                id="start_date"
                                type="datetime-local"
                                value={formData.start_date}
                                onChange={(e) => updateFormData('start_date', e.target.value)}
                                required
                            />
                            {errors.start_date && <div className="text-red-500 text-sm mt-1">{errors.start_date}</div>}
                        </div>

                        <div>
                            <Label htmlFor="end_date">End Date *</Label>
                            <Input
                                id="end_date"
                                type="datetime-local"
                                value={formData.end_date}
                                onChange={(e) => updateFormData('end_date', e.target.value)}
                                required
                            />
                            {errors.end_date && <div className="text-red-500 text-sm mt-1">{errors.end_date}</div>}
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => updateFormData('description', e.target.value)}
                                rows={4}
                                required
                            />
                            {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                        </div>

                        <div>
                            <Label htmlFor="capacity">Capacity (Optional)</Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => updateFormData('capacity', Math.max(0, (formData.capacity || 0) - 1))}
                                >
                                    -
                                </Button>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => updateFormData('capacity', parseInt(e.target.value) || 0)}
                                    className="text-center"
                                    min="0"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => updateFormData('capacity', (formData.capacity || 0) + 1)}
                                >
                                    +
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Set to 0 for unlimited capacity</p>
                            {errors.capacity && <div className="text-red-500 text-sm mt-1">{errors.capacity}</div>}
                        </div>

                        <div>
                            <Label htmlFor="fee">Fee (RM) (Optional)</Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => updateFormData('fee', Math.max(0, (formData.fee || 0) - 1))}
                                >
                                    -
                                </Button>
                                <div className="relative w-full">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                        RM
                                    </span>
                                    <Input
                                        id="fee"
                                        type="number"
                                        step="0.01"
                                        value={formData.fee ?? ''}
                                        onBlur={(e) => {
                                            const value = parseFloat(e.target.value);
                                            if (!isNaN(value)) {
                                                updateFormData('fee', parseFloat(value.toFixed(2)));
                                            } else {
                                                updateFormData('fee', null);
                                            }
                                        }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            updateFormData('fee', value ? parseFloat(value) : null);
                                        }}
                                        className="pl-12 text-center"
                                        min="0"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => updateFormData('fee', (formData.fee || 0) + 1)}
                                >
                                    +
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Leave empty for free events</p>
                            {errors.fee && <div className="text-red-500 text-sm mt-1">{errors.fee}</div>}
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="status">Status *</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => updateFormData('status', value as 'draft' | 'published' | 'archived')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Only published events will be visible to members
                            </p>
                            {errors.status && <div className="text-red-500 text-sm mt-1">{errors.status}</div>}
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="image">Event Poster {event && '(Upload new to replace)'}</Label>
                            <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    updateFormData('image', file);
                                    if (file) {
                                        setPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                            <div className="mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Choose File
                                </Button>
                                {formData.image && <span className="ml-2 text-sm">{formData.image.name}</span>}
                            </div>
                            {preview && (
                                <div className="mt-2">
                                    <img src={preview} alt="preview" className="h-32 w-auto object-cover rounded border" />
                                </div>
                            )}
                            {errors.image && <div className="text-red-500 text-sm mt-1">{errors.image}</div>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}