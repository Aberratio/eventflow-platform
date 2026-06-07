import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import type { Event } from '@/types';
import { EventDistancesTab, EventInfoTab, EventSidebar } from '..';

const event: Event = {
  id: 'participant-visible-event',
  name: 'Bieg Widoczny Dla Uczestnika',
  slug: 'bieg-widoczny-dla-uczestnika',
  discipline: 'running',
  date: '2026-06-15',
  location: 'Stadion Testowy',
  city: 'Warszawa',
  description: '<p><strong>Opis publiczny</strong> z formatowaniem.</p>',
  imageUrl: 'https://example.test/event.jpg',
  organizerId: 'organizer-1',
  organizerName: 'Organizator Testowy',
  organizerContact: {
    email: 'kontakt@example.test',
    phone: '500600700',
    website: 'https://example.test',
  },
  status: 'active',
  registrationDeadline: '2026-06-01',
  featured: false,
  organizersHtml: '<p>Partner techniczny <a href="https://partner.example.test">Partner</a></p>',
  rulesHtml: '<ul><li>Regulamin uczestnika</li></ul>',
  distances: [
    {
      id: 'distance-10k',
      name: '10 km',
      length: 10,
      unit: 'km',
      categories: ['Open'],
      registeredCount: 42,
      limit: 100,
      price: 80,
      routeGpxUrl: 'https://example.test/10k.gpx',
    },
    {
      id: 'distance-5k',
      name: '5 km',
      length: 5,
      unit: 'km',
      categories: ['Open'],
      registeredCount: 10,
      price: 50,
    },
  ],
};

describe('participant event display', () => {
  it('renders public rich text information for participants', () => {
    render(<EventInfoTab event={event} />);

    expect(screen.getByText('Opis publiczny')).toBeInTheDocument();
    expect(screen.getByText(/z formatowaniem/i)).toBeInTheDocument();
    expect(screen.getByText('Partner techniczny')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Partner' })).toHaveAttribute(
      'href',
      'https://partner.example.test',
    );
    expect(screen.getByText('Regulamin uczestnika')).toBeInTheDocument();
    expect(screen.getByText('kontakt@example.test')).toBeInTheDocument();
    expect(screen.getByText('500600700')).toBeInTheDocument();
  });

  it('renders saved distances, prices, limits and route downloads', () => {
    render(<EventDistancesTab event={event} />);

    expect(screen.getAllByText('10 km').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5 km').length).toBeGreaterThan(0);
    expect(screen.getByText('42 / 100 zapisanych')).toBeInTheDocument();
    expect(screen.getByText('10 zapisanych')).toBeInTheDocument();
    expect(screen.getByText('80 zł')).toBeInTheDocument();
    expect(screen.getByText('50 zł')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /GPX/i })).toHaveAttribute(
      'href',
      'https://example.test/10k.gpx',
    );
  });

  it('renders structured distance categories in grouped sections', () => {
    const eventWithCategories: Event = {
      ...event,
      distances: [
        {
          ...event.distances[0],
          categories: ['M30', 'K30', 'Firmowa', 'Open'],
          ageCategories: [
            {
              id: 'm30',
              name: 'M30',
              gender: 'M',
              birthYearFrom: 1987,
              birthYearTo: 1996,
            },
            {
              id: 'k30',
              name: 'K30',
              gender: 'K',
              birthYearFrom: 1987,
              birthYearTo: 1996,
            },
          ],
          specialCategories: [
            {
              id: 'firmowa',
              name: 'Firmowa',
              description: 'Klasyfikacja dla pracowników firm.',
            },
          ],
        },
      ],
    };

    render(<EventDistancesTab event={eventWithCategories} />);

    expect(screen.getByText('Wiekowe')).toBeInTheDocument();
    expect(screen.getByText('Specjalne')).toBeInTheDocument();
    expect(screen.getByText('Pozostałe')).toBeInTheDocument();
    expect(screen.getAllByText('Roczniki 1987-1996')).toHaveLength(2);
    expect(screen.getByText('Klasyfikacja dla pracowników firm.')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders participant registration CTA from saved event data', () => {
    const onRegister = vi.fn();

    render(
      <EventSidebar
        event={event}
        user={null}
        userRegistration={null}
        isRegistrationOpen
        closedReason={null}
        onRegister={onRegister}
        onShare={vi.fn()}
      />,
    );

    expect(screen.getByText(/Ceny od/i)).toBeInTheDocument();
    expect(screen.getByText('50 zł')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zapisz się teraz/i })).toBeEnabled();
    expect(screen.getByText(/Zapisy do/i)).toHaveTextContent('1 czerwca 2026');
  });
});
