import { CalendarEvent } from '@/types';

//mock data for testing
export const mockEvents: CalendarEvent[] = [
    {
        id: '1',
        title: 'Flight Day',
        start: new Date('2024-06-01T06:00:00'),
        end: new Date('2024-06-01T22:00:00'),
        calendar: 'Work',
        type: 'duty',
    },
    {
        id: '2',
        title: 'Flight to AMS',
        start: new Date('2024-06-01T08:00:00'),
        end: new Date('2024-06-01T10:00:00'),
        calendar: 'Work',
        type: 'flight',
        details: {
            route: 'BHX-AMS',
            departure: 'BHX',
            arrival: 'AMS',
            flightNumber: 'KL1234',
            aircraft: 'E190',
        },
    },
    {
        id: '3',
        title: 'Ground Time',
        start: new Date('2024-06-01T10:00:00'),
        end: new Date('2024-06-01T11:00:00'),
        calendar: 'Work',
        type: 'duty',
    },
    {
        id: '4',
        title: 'Flight to BHX',
        start: new Date('2024-06-01T11:00:00'),
        end: new Date('2024-06-01T13:00:00'),
        calendar: 'Work',
        type: 'flight',
        details: {
            route: 'AMS-BHX',
            departure: 'AMS',
            arrival: 'BHX',
            flightNumber: 'KL4321',
            aircraft: 'E190',
        },
    },
    {
        id: '5',
        title: 'Taxi to Home',
        start: new Date('2024-06-01T13:30:00'),
        end: new Date('2024-06-01T14:00:00'),
        calendar: 'Work',
        type: 'taxi',
    },
    {
        id: '6',
        title: 'LVEC - Day Off',
        start: new Date('2024-06-02T00:00:00'),
        end: new Date('2024-06-02T23:59:59'),
        calendar: 'Work',
        type: 'duty',
    }
];