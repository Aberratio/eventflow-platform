import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  prepareParticipantsExport,
  prepareResultsExport,
  generateHTMLTable,
  exportToCSV,
  exportToXML,
} from '../exportUtils';
import { Registration, Result } from '@/types';

describe('prepareParticipantsExport', () => {
  it('maps registrations to export format', () => {
    const regs: Registration[] = [
      {
        id: '1',
        eventId: 'e1',
        eventName: 'Maraton',
        userId: 'u1',
        userName: 'Jan Kowalski',
        userEmail: 'jan@test.pl',
        distanceId: 'd1',
        distanceName: '10 km',
        category: 'M30',
        status: 'confirmed',
        registeredAt: '2026-01-15',
        bibNumber: '42',
        pricePaid: 100,
      },
    ];

    const result = prepareParticipantsExport(regs);
    expect(result).toHaveLength(1);
    expect(result[0]['Imię i nazwisko']).toBe('Jan Kowalski');
    expect(result[0]['Numer startowy']).toBe('42');
    expect(result[0]['Status']).toBe('Potwierdzony');
  });

  it('handles missing optional fields', () => {
    const regs: Registration[] = [
      {
        id: '1',
        eventId: 'e1',
        eventName: 'Bieg',
        userId: 'u1',
        userName: 'Anna',
        userEmail: 'anna@test.pl',
        distanceId: 'd1',
        distanceName: '5 km',
        category: 'K',
        status: 'pending',
        registeredAt: '2026-02-01',
      },
    ];

    const result = prepareParticipantsExport(regs);
    expect(result[0]['Numer startowy']).toBe('-');
    expect(result[0]['Drużyna']).toBe('-');
    expect(result[0]['Kwota']).toBe('-');
  });
});

describe('prepareResultsExport', () => {
  it('maps results to export format', () => {
    const results: Result[] = [
      {
        id: '1',
        eventId: 'e1',
        eventName: 'Maraton',
        distanceId: 'd1',
        distanceName: '42 km',
        userId: 'u1',
        userName: 'Jan',
        bibNumber: '1',
        position: 1,
        categoryPosition: 1,
        time: '01:23:45',
        timeInSeconds: 5025,
        category: 'M30',
        status: 'finished',
      },
    ];

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

  it('renders null values as dash', () => {
    const data = [{ Name: 'Test', Value: null }];
    const html = generateHTMLTable(data as unknown as Record<string, unknown>[]);
    expect(html).toContain('<td>-</td>');
  });

  it('renders multiple rows', () => {
    const data = [{ A: '1' }, { A: '2' }];
    const html = generateHTMLTable(data);
    expect(html).toContain('<td>1</td>');
    expect(html).toContain('<td>2</td>');
  });
});

describe('exportToCSV', () => {
  let createdUrl: string;
  let clickedLink: HTMLAnchorElement | null;

  beforeEach(() => {
    createdUrl = '';
    clickedLink = null;

    URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
    URL.revokeObjectURL = vi.fn();

    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag);
      if (tag === 'a') {
        clickedLink = el as HTMLAnchorElement;
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => {});
      }
      return el;
    });
  });

  it('does nothing when data is empty', () => {
    exportToCSV([], 'test');
    expect(clickedLink).toBeNull();
  });

  it('triggers download with correct filename', () => {
    exportToCSV([{ Name: 'Jan', Score: 42 }], 'wyniki');
    expect(clickedLink).not.toBeNull();
    expect(clickedLink!.download).toBe('wyniki.csv');
  });

  it('uses semicolon as delimiter', () => {
    let blobContent = '';
    const OriginalBlob = globalThis.Blob;
    vi.spyOn(globalThis, 'Blob').mockImplementation((parts: BlobPart[]) => {
      blobContent = parts.join('');
      return new OriginalBlob(parts);
    });

    exportToCSV([{ Imię: 'Jan', Wynik: 100 }], 'test');
    expect(blobContent).toContain(';');
  });

  it('wraps values containing semicolons in quotes', () => {
    let blobContent = '';
    const OriginalBlob = globalThis.Blob;
    vi.spyOn(globalThis, 'Blob').mockImplementation((parts: BlobPart[]) => {
      blobContent = parts.join('');
      return new OriginalBlob(parts);
    });

    exportToCSV([{ Opis: 'Bieg; Szybki' }], 'test');
    expect(blobContent).toContain('"Bieg; Szybki"');
  });
});

describe('exportToXML', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
    URL.revokeObjectURL = vi.fn();

    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag);
      if (tag === 'a') {
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => {});
      }
      return el;
    });
  });

  it('does nothing when data is empty', () => {
    const createSpy = vi.spyOn(document, 'createElement');
    const callsBefore = createSpy.mock.calls.length;
    exportToXML([], 'root', 'item', 'test');
    expect(createSpy.mock.calls.length).toBe(callsBefore);
  });

  it('generates XML with correct structure', () => {
    let blobContent = '';
    const OriginalBlob = globalThis.Blob;
    vi.spyOn(globalThis, 'Blob').mockImplementation((parts: BlobPart[]) => {
      blobContent = parts.join('');
      return new OriginalBlob(parts);
    });

    exportToXML([{ name: 'Jan', score: 42 }], 'results', 'result', 'export');

    expect(blobContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(blobContent).toContain('<results>');
    expect(blobContent).toContain('<result>');
    expect(blobContent).toContain('<name>Jan</name>');
    expect(blobContent).toContain('<score>42</score>');
    expect(blobContent).toContain('</results>');
  });

  it('escapes XML special characters', () => {
    let blobContent = '';
    const OriginalBlob = globalThis.Blob;
    vi.spyOn(globalThis, 'Blob').mockImplementation((parts: BlobPart[]) => {
      blobContent = parts.join('');
      return new OriginalBlob(parts);
    });

    exportToXML([{ name: '<Jan & Nowak>' }], 'root', 'item', 'test');
    expect(blobContent).toContain('&lt;Jan &amp; Nowak&gt;');
  });
});

describe('prepareResultsExport – DNF/DNS/DSQ statuses', () => {
  it('labels dns status correctly', () => {
    const results: Result[] = [
      {
        id: '4',
        eventId: 'e1',
        eventName: 'Bieg',
        distanceId: 'd1',
        distanceName: '10 km',
        userId: 'u1',
        userName: 'Ewa',
        bibNumber: '9',
        position: 0,
        categoryPosition: 0,
        time: 'DNS',
        timeInSeconds: 0,
        category: 'K30',
        status: 'dns',
      },
    ];

    const out = prepareResultsExport(results);
    expect(out[0]['Status']).toBe('DNS');
  });

  it('labels dnf status correctly', () => {
    const results: Result[] = [
      {
        id: '2',
        eventId: 'e1',
        eventName: 'Bieg',
        distanceId: 'd1',
        distanceName: '10 km',
        userId: 'u1',
        userName: 'Piotr',
        bibNumber: '5',
        position: 9999,
        categoryPosition: 9999,
        time: 'DNF',
        timeInSeconds: 0,
        category: 'M30',
        status: 'dnf',
      },
    ];

    const out = prepareResultsExport(results);
    expect(out[0]['Status']).toBe('DNF');
  });

  it('labels dsq status correctly', () => {
    const results: Result[] = [
      {
        id: '3',
        eventId: 'e1',
        eventName: 'Bieg',
        distanceId: 'd1',
        distanceName: '10 km',
        userId: 'u1',
        userName: 'Anna',
        bibNumber: '7',
        position: 9999,
        categoryPosition: 9999,
        time: 'DSQ',
        timeInSeconds: 0,
        category: 'K30',
        status: 'dsq',
      },
    ];

    const out = prepareResultsExport(results);
    expect(out[0]['Status']).toBe('DSQ');
  });
});

describe('prepareParticipantsExport – status labels', () => {
  const makeReg = (status: string): Registration => ({
    id: '1',
    eventId: 'e1',
    eventName: 'Bieg',
    userId: 'u1',
    userName: 'Test',
    userEmail: 'test@test.pl',
    distanceId: 'd1',
    distanceName: '5 km',
    category: 'Open',
    status: status as Registration['status'],
    registeredAt: '2026-01-01',
  });

  it('labels cancelled status', () => {
    expect(prepareParticipantsExport([makeReg('cancelled')])[0]['Status']).toBe('Anulowany');
  });

  it('labels removed status', () => {
    expect(prepareParticipantsExport([makeReg('removed')])[0]['Status']).toBe('Usunięty');
  });

  it('labels unknown status as-is', () => {
    expect(prepareParticipantsExport([makeReg('unknown_status')])[0]['Status']).toBe(
      'unknown_status',
    );
  });

  it('produces sequential Lp. numbering', () => {
    const regs = [makeReg('confirmed'), makeReg('pending'), makeReg('confirmed')];
    const out = prepareParticipantsExport(regs);
    expect(out[0]['Lp.']).toBe(1);
    expect(out[1]['Lp.']).toBe(2);
    expect(out[2]['Lp.']).toBe(3);
  });
});
