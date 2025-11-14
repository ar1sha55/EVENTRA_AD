import React from 'react';
import { Link } from '@inertiajs/react';
import { Event } from '@/types/Event';

interface Props {
    events: Event[];
}

const Index: React.FC<Props> = ({ events }) => {
    return (
        <div>
            <h1>Events</h1>
            <Link href={route('events.create')}>Create Event</Link>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Location</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event) => (
                        <tr key={event.id}>
                            <td>{event.name}</td>
                            <td>{event.start_date}</td>
                            <td>{event.end_date}</td>
                            <td>{event.location}</td>
                            <td>
                                <Link href={route('events.show', event.id)}>Show</Link>
                                <Link href={route('events.edit', event.id)}>Edit</Link>
                                <Link href={route('events.destroy', event.id)} method="delete" as="button">Delete</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Index;
