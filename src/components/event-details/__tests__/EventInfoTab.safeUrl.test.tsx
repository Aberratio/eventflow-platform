import { describe, expect, it } from 'vitest';
import { render } from '@/test/test-utils';
import type { Event } from '@/types';
import { EventInfoTab } from '../EventInfoTab';

const POISON = 'javascript:window.__xss=1';
const DANGEROUS_HREF = /^\s*(javascript|data|vbscript):/i;

const buildEvent = (urls: {
  maps: string;
  parkingMaps: string;
  scheduleDoc: string;
  rulesDoc: string;
  website: string;
  sponsor: string;
}): Event =>
  ({
    id: 'e1',
    name: 'Bieg testowy',
    slug: 'bieg-testowy',
    discipline: 'running',
    date: '2027-05-01',
    location: 'Stadion',
    city: 'Warszawa',
    description: '<p>Opis</p>',
    distances: [],
    organizerId: 'o1',
    organizerName: 'Organizator',
    registrationDeadline: '2027-04-01',
    featured: false,
    locationMapsUrl: urls.maps,
    logisticsInfo: {
      parking: {
        status: 'yes',
        locations: [{ id: 'l1', label: 'Parking A', mapsUrl: urls.parkingMaps }],
      },
    },
    documents: [
      {
        id: 'd1',
        name: 'Harmonogram imprezy',
        type: 'harmonogram',
        fileUrl: urls.scheduleDoc,
        fileName: 'h.pdf',
        mimeType: 'application/pdf',
      },
      {
        id: 'd2',
        name: 'Regulamin imprezy',
        type: 'regulamin',
        fileUrl: urls.rulesDoc,
        fileName: 'r.pdf',
        mimeType: 'application/pdf',
      },
    ],
    organizerContact: { email: 'biuro@example.pl', website: urls.website },
    organizerInfo: { sponsors: [{ id: 's1', name: 'Sponsor Jeden', url: urls.sponsor }] },
  }) as unknown as Event;

const hrefs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('a[href]')).map((a) => a.getAttribute('href') ?? '');

describe('EventInfoTab URL safety', () => {
  it('renders no javascript:/data: href for poisoned stored URLs and keeps the website as text', () => {
    const { container, getByText } = render(
      <EventInfoTab
        event={buildEvent({
          maps: POISON,
          parkingMaps: POISON,
          scheduleDoc: POISON,
          rulesDoc: 'data:text/html,<script>1</script>',
          website: POISON,
          sponsor: 'vbscript:msgbox(1)',
        })}
      />,
    );

    expect(hrefs(container).filter((h) => DANGEROUS_HREF.test(h))).toEqual([]);
    expect(container.querySelector('a[href^="javascript" i]')).toBeNull();
    expect(getByText(POISON)).toBeTruthy();
    expect(getByText('Sponsor Jeden')).toBeTruthy();
  });

  it('renders the anchors with the exact hrefs for https values', () => {
    const { container } = render(
      <EventInfoTab
        event={buildEvent({
          maps: 'https://maps.example/start',
          parkingMaps: 'https://maps.example/parking',
          scheduleDoc: 'https://cdn.example/harmonogram.pdf',
          rulesDoc: '/uploads/event-docs/regulamin.pdf',
          website: 'https://organizator.example',
          sponsor: 'https://sponsor.example',
        })}
      />,
    );

    const all = hrefs(container);
    for (const expected of [
      'https://maps.example/start',
      'https://maps.example/parking',
      'https://cdn.example/harmonogram.pdf',
      '/uploads/event-docs/regulamin.pdf',
      'https://organizator.example',
      'https://sponsor.example',
    ]) {
      expect(all).toContain(expected);
    }
  });
});
