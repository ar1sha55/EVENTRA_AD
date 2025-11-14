import React, { useEffect, useRef, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
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
    const { data, setData, post, processing, errors, reset } = useForm({
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
    const [isFeeFocused, setIsFeeFocused] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (event) {
            setData({
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
            reset();
            setPreview(null);
        }
    }, [event, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };

        if (event) {
            router.post(`/events/${event.id}`, {
                ...data,
                _method: 'put',
            }, options);
        } else {
            post('/events', options);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{event ? 'Edit Event' : 'Create Event'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                            {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                        </div>

                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={data.location}
                                onChange={(e) => setData('location', e.target.value)}
                            />
                            {errors.location && <div className="text-red-500 text-sm mt-1">{errors.location}</div>}
                        </div>

                        <div>
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                type="datetime-local"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                            />
                            {errors.start_date && <div className="text-red-500 text-sm mt-1">{errors.start_date}</div>}
                        </div>

                        <div>
                            <Label htmlFor="end_date">End Date</Label>
                            <Input
                                id="end_date"
                                type="datetime-local"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                            />
                            {errors.end_date && <div className="text-red-500 text-sm mt-1">{errors.end_date}</div>}
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={4}
                            />
                            {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                        </div>

                        <div>
                            <Label htmlFor="capacity">Capacity</Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setData('capacity', Math.max(0, (data.capacity || 0) - 1))}
                                >
                                    -
                                </Button>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={data.capacity}
                                    onChange={(e) => setData('capacity', parseInt(e.target.value) || 0)}
                                    className="text-center"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setData('capacity', (data.capacity || 0) + 1)}
                                >
                                    +
                                </Button>
                            </div>
                            {errors.capacity && <div className="text-red-500 text-sm mt-1">{errors.capacity}</div>}
                        </div>

                        <div>
                            <Label htmlFor="fee">Fee</Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setData('fee', Math.max(0, (data.fee || 0) - 1))}
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
                                        value={data.fee ?? ''}
                                        onBlur={(e) => {
                                            const value = parseFloat(e.target.value);
                                            if (!isNaN(value)) {
                                                setData('fee', parseFloat(value.toFixed(2)));
                                            } else {
                                                setData('fee', null);
                                            }
                                        }}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setData('fee', value ? parseFloat(value) : null);
                                        }}
                                        className="pl-12 text-center"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setData('fee', (data.fee || 0) + 1)}
                                >
                                    +
                                </Button>
                            </div>
                            {errors.fee && <div className="text-red-500 text-sm mt-1">{errors.fee}</div>}
                        </div>

                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) => setData('status', value as 'draft' | 'published' | 'archived')}
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
                            {errors.status && <div className="text-red-500 text-sm mt-1">{errors.status}</div>}
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="image">Event Poster</Label>
                            <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setData('image', file);
                                    if (file) setPreview(URL.createObjectURL(file));
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
                                {data.image && <span className="ml-2">{data.image.name}</span>}
                            </div>
                            {preview && <img src={preview} alt="preview" className="h-16 w-16 object-cover mt-2 rounded" />}
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
                            {processing ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
