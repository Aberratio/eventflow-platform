import type { Ticket, Certificate } from '@/types';
import { mockResults } from './results.mock';

export const mockTickets: Ticket[] = [
  {
    id: 't1',
    eventId: 'e1',
    eventName: 'Maraton Warszawski 2026',
    userId: 'u1',
    ticketNumber: 'TICKET-2026-001',
    type: 'standard',
    status: 'valid',
    purchasedAt: '2026-01-15T10:00:00Z',
    qrCode: 'QR-TICKET-001',
  },
];

export const mockCertificates: Certificate[] = [
  {
    id: 'cert1',
    eventId: 'e11',
    eventName: 'Bieg Niepodległości',
    userId: 'u1',
    resultId: 'r1',
    distance: '10 km',
    time: '00:42:15',
    position: 1,
    issuedAt: '2025-11-11T14:00:00Z',
    downloadUrl: '/certificates/cert1.pdf',
  },
];
