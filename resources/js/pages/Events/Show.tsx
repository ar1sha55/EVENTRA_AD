import React from 'react';
import { Link } from '@inertiajs/react';
import { Event } from '@/types/Event';

interface Props {
    event: Event;
}

const Show: React.FC<Props> = ({ event }) => {
    return (
        <div>
            <h1>Event Details</h1>
            <p><strong>Name:</strong> {event.name}</p>
            <p><strong>Description:</strong> {event.description}</p>
            <p><strong>Start Date:</strong> {event.start_date}</p>
            <p><strong>End Date:</strong> {event.end_date}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <Link href={route('events.index')}>Back to Events</Link>
            <Link href={route('events.edit', event.id)}>Edit Event</Link>
        </div>
    );
};

export default Show;
