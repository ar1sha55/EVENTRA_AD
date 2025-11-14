import React from 'react';
import { useForm } from '@inertiajs/react';
import { Event } from '@/types/Event';

interface Props {
    event: Event;
}

const Edit: React.FC<Props> = ({ event }) => {
    const { data, setData, put, errors } = useForm({
        name: event.name,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        location: event.location,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('events.update', event.id));
    };

    return (
        <div>
            <h1>Edit Event</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Name</label>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    {errors.name && <div>{errors.name}</div>}
                </div>
                <div>
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                    />
                    {errors.description && <div>{errors.description}</div>}
                </div>
                <div>
                    <label htmlFor="start_date">Start Date</label>
                    <input
                        id="start_date"
                        type="datetime-local"
                        value={data.start_date}
                        onChange={(e) => setData('start_date', e.target.value)}
                    />
                    {errors.start_date && <div>{errors.start_date}</div>}
                </div>
                <div>
                    <label htmlFor="end_date">End Date</label>
                    <input
                        id="end_date"
                        type="datetime-local"
                        value={data.end_date}
                        onChange={(e) => setData('end_date', e.target.value)}
                    />
                    {errors.end_date && <div>{errors.end_date}</div>}
                </div>
                <div>
                    <label htmlFor="location">Location</label>
                    <input
                        id="location"
                        type="text"
                        value={data.location}
                        onChange={(e) => setData('location', e.target.value)}
                    />
                    {errors.location && <div>{errors.location}</div>}
                </div>
                <button type="submit">Update</button>
            </form>
        </div>
    );
};

export default Edit;
