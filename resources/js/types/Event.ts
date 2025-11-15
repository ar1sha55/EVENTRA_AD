import { Participant } from './Participant';

export interface Event {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    capacity?: number;
    participants?: Participant[];
    image_path?: string;
}
