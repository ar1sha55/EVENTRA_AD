import { User } from './';

export interface Participant {
    id: number;
    user_id: number;
    event_id: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    registration_date: string;
    last_updated: string;
    user: User;
}
