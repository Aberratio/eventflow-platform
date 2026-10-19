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
  publicationStatus: 'published',
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
    expect(screen.getByText('80,00 zł')).toBeInTheDocument();
    expect(screen.getByText('50,00 zł')).toBeInTheDocument();
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

    expect(screen.getByText('Podstawowe')).toBeInTheDocument();
    expect(screen.getByText('Specjalne')).toBeInTheDocument();
    expect(screen.getByText('Pozostałe')).toBeInTheDocument();
    expect(screen.getAllByText('Roczniki 1987–1996')).toHaveLength(2);
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

    expect(screen.getByText(/Cena od/i)).toBeInTheDocument();
    expect(screen.getByText('50,00 zł')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rozpocznij zapis/i })).toBeEnabled();
    expect(screen.getByText(/Zapisy do/i)).toHaveTextContent('1 czerwca 2026');
  });

  it('renders upcoming registration CTA when registration has not started', () => {
    render(
      <EventSidebar
        event={{
          ...event,
          registrationStatus: 'none',
          registrationEmbed: { enabled: true, startDate: '2099-07-01', endDate: '2099-08-01' },
        }}
        user={null}
        userRegistration={null}
        isRegistrationOpen={false}
        closedReason="Zapisy jeszcze nieaktywne"
        onRegister={vi.fn()}
        onShare={vi.fn()}
      />,
    );

    expect(screen.getByText('Zapisy wkrótce')).toBeInTheDocument();
    expect(screen.getByText('Start zapisów')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zapisy jeszcze nieaktywne/i })).toBeDisabled();
    expect(screen.getByText('Wróć tutaj, gdy zapisy się rozpoczną')).toBeInTheDocument();
  });

  it('renders urgent registration CTA when places are limited', () => {
    render(
      <EventSidebar
        event={{
          ...event,
          distances: [
            {
              ...event.distances[0],
              registeredCount: 88,
              limit: 100,
              price: 50,
            },
          ],
        }}
        user={null}
        userRegistration={null}
        isRegistrationOpen
        closedReason={null}
        onRegister={vi.fn()}
        onShare={vi.fn()}
      />,
    );

    expect(screen.getByText('Kończą się zapisy')).toBeInTheDocument();
    expect(screen.getByText('Zostało 12 miejsc')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rozpocznij zapis/i })).toBeEnabled();
  });

  it('renders closed registration CTA without register action', () => {
    render(
      <EventSidebar
        event={{
          ...event,
          registrationStatus: 'closed',
          distances: [
            {
              ...event.distances[0],
              registeredCount: 100,
              limit: 100,
              price: 50,
            },
          ],
        }}
        user={null}
        userRegistration={null}
        isRegistrationOpen={false}
        closedReason="Termin zapisów minął"
        onRegister={vi.fn()}
        onShare={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Zapisy zamknięte')).toHaveLength(2);
    expect(screen.getByText('Brak dostępnych miejsc')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Brak możliwości zapisu/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Udostępnij/i })).toBeInTheDocument();
  });

  it('renders paid participant registration status with share action', () => {
    render(
      <EventSidebar
        event={{ ...event, paymentConfig: { type: 'admin_gateway' } }}
        user={null}
        userRegistration={{
          id: 'reg-paid',
          eventId: event.id,
          eventName: event.name,
          userId: 'p1',
          userName: 'Jan Kowalski',
          userEmail: 'jan@example.test',
          distanceId: 'distance-5k',
          distanceName: '5 km',
          category: 'Open',
          registeredAt: '2026-01-01T10:00:00Z',
          status: 'confirmed',
          pricePaid: 50,
          paymentDetails: {
            startFeePaid: true,
            startFeeAmount: 50,
            insurancePaid: false,
            merchandisePayments: [],
          },
        }}
        isRegistrationOpen
        closedReason={null}
        onRegister={vi.fn()}
        onShare={vi.fn()}
      />,
    );

    expect(screen.getByText('Jesteś zapisany!')).toBeInTheDocument();
    expect(screen.getByText('Opłacone')).toBeInTheDocument();
    expect(screen.getByText('Płatność online')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Udostępnij/i })).toBeInTheDocument();
  });

  it('renders bank transfer reminder with share action while payment is pending', () => {
    render(
      <EventSidebar
        event={{
          ...event,
          paymentConfig: {
            type: 'organizer_bank',
            bankAccountNumber: '12 3456 7890 1234 5678 9012 3456',
            bankAccountHolder: 'Organizator Testowy',
            transferTitle: 'Opłata za {eventName} - {participantName}',
          },
        }}
        user={null}
        userRegistration={{
          id: 'reg-waiting',
          eventId: event.id,
          eventName: event.name,
          userId: 'p1',
          userName: 'Jan Kowalski',
          userEmail: 'jan@example.test',
          distanceId: 'distance-5k',
          distanceName: '5 km',
          category: 'Open',
          registeredAt: '2026-01-01T10:00:00Z',
          status: 'pending',
          pricePaid: 50,
          paymentDetails: {
            startFeePaid: false,
            startFeeAmount: 50,
            insurancePaid: false,
            merchandisePayments: [],
          },
        }}
        isRegistrationOpen
        closedReason={null}
        onRegister={vi.fn()}
        onShare={vi.fn()}
      />,
    );

    expect(screen.getByText('Czekamy na przelew')).toBeInTheDocument();
    expect(screen.getByText('50,00 zł')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Przypomnij dane do przelewu/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Udostępnij/i })).toBeInTheDocument();
  });
});
