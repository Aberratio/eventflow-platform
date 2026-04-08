import type { Ticket, Certificate } from '@/types';

export const mockTickets: Ticket[] = [
  {
    id: 't1',
    eventId: 'e1',
    eventName: 'Maraton Warszawski 2026',
    eventDate: '2026-09-27',
    distanceId: 'd1',
    distanceName: '42,195 km',
    location: 'Warszawa, Stadion Narodowy',
    participantName: 'Jan Kowalski',
    participantId: 'u1',
    bibNumber: '1001',
    category: 'M30',
    registrationId: 'reg1',
  },
];

export const mockCertificates: Certificate[] = [
  {
    id: 'cert1',
    eventId: 'e11',
    eventName: 'Bieg Niepodległości',
    date: '2025-11-11',
    distance: '10 km',
    time: '00:42:15',
    position: 1,
    downloadUrl: '/certificates/cert1.pdf',
  },
];
