import { type SharedData } from '@/types';
import { type Event } from './Event';

export interface JoinEventsPageProps extends SharedData {
    events: Event[];
}
