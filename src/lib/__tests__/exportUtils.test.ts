import { describe, it, expect } from 'vitest';
import { prepareParticipantsExport, prepareResultsExport, generateHTMLTable } from '../exportUtils';
import { Registration, Result } from '@/types';

describe('prepareParticipantsExport', () => {
  it('maps registrations to export format', () => {
    const regs: Registration[] = [{
      id: '1', eventId: 'e1', eventName: 'Maraton', userId: 'u1', userName: 'Jan Kowalski',
      userEmail: 'jan@test.pl', distanceId: 'd1', distanceName: '10 km',
      category: 'M30', status: 'confirmed', registeredAt: '2026-01-15',
      bibNumber: '42', pricePaid: 100,
    }];

    const result = prepareParticipantsExport(regs);
    expect(result).toHaveLength(1);
    expect(result[0]['Imię i nazwisko']).toBe('Jan Kowalski');
    expect(result[0]['Numer startowy']).toBe('42');
    expect(result[0]['Status']).toBe('Potwierdzony');
  });

  it('handles missing optional fields', () => {
    const regs: Registration[] = [{
      id: '1', eventId: 'e1', eventName: 'Bieg', userId: 'u1', userName: 'Anna',
      userEmail: 'anna@test.pl', distanceId: 'd1', distanceName: '5 km',
      category: 'K', status: 'pending', registeredAt: '2026-02-01',
    }];

    const result = prepareParticipantsExport(regs);
    expect(result[0]['Numer startowy']).toBe('-');
    expect(result[0]['Drużyna']).toBe('-');
    expect(result[0]['Kwota']).toBe('-');
  });
});

describe('prepareResultsExport', () => {
  it('maps results to export format', () => {
    const results: Result[] = [{
      id: '1', eventId: 'e1', eventName: 'Maraton', distanceId: 'd1',
      distanceName: '42 km', userId: 'u1', userName: 'Jan', bibNumber: '1',
      position: 1, categoryPosition: 1, time: '01:23:45', timeInSeconds: 5025,
      category: 'M30', status: 'finished',
    }];

    const out = prepareResultsExport(results);
    expect(out[0]['Pozycja']).toBe(1);
    expect(out[0]['Czas']).toBe('01:23:45');
    expect(out[0]['Status']).toBe('Ukończył');
  });
});

describe('generateHTMLTable', () => {
  it('returns message for empty data', () => {
    expect(generateHTMLTable([])).toContain('Brak danych');
  });

  it('generates valid table HTML', () => {
    const data = [{ Name: 'Test', Value: '123' }];
    const html = generateHTMLTable(data);
    expect(html).toContain('<table>');
    expect(html).toContain('<th>Name</th>');
    expect(html).toContain('<td>Test</td>');
  });
});
