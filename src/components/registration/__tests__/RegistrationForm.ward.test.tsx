import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { RegistrationForm } from '../RegistrationForm';
import type { Event } from '@/types';

// PP.44: the real useRegistrationForm hook (not mocked) drives the personal-data step.

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: 'u1',
        name: 'Jan Kowalski',
        email: 'jan@example.com',
        role: 'participant',
        birthYear: 1990,
        gender: 'M',
      },
      isAuthenticated: true,
    }),
  };
});

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getRegistrationsByEvent: vi.fn().mockResolvedValue({ data: [], success: true }),
    getTeamsForDistance: vi.fn().mockResolvedValue({ data: [], success: true }),
  };
});

const event = {
  id: 'e1',
  name: 'Test Event',
  slug: 'test-event',
  discipline: 'running',
  date: '2027-06-01',
  location: 'Park',
  city: 'Warszawa',
  description: 'Test',
  imageUrl: '/test.jpg',
  organizerId: 'o1',
  organizerName: 'Organizer',
  publicationStatus: 'published',
  registrationDeadline: '2027-05-20',
  featured: false,
  discountCodes: [],
  enableMerchandiseInRegistration: false,
  distances: [
    {
      id: 'd1',
      name: '5 km',
      length: 5,
      unit: 'km',
      price: 0,
      categories: [],
      registeredCount: 0,
      ageCategories: [
        { id: 'kids', name: 'Dzieci 2014–2017', birthYearFrom: 2014, birthYearTo: 2017 },
        { id: 'm30', name: 'M30', gender: 'M', birthYearFrom: 1987, birthYearTo: 1996 },
      ],
    },
  ],
} as unknown as Event;

const renderToPersonalData = async (participant?: {
  key: string;
  name: string;
  birthDate?: string;
}) => {
  const user = userEvent.setup();
  render(
    <RegistrationForm
      event={event}
      participant={participant}
      onComplete={vi.fn()}
      onCancel={vi.fn()}
    />,
  );
  await user.click(await screen.findByRole('button', { name: /Dalej/ }));
  await screen.findByText('Dane osobowe');
};

describe('RegistrationForm personal-data step', () => {
  it("shows the ward's data and age category on the personal-data step", async () => {
    await renderToPersonalData({
      key: 'c-zosia',
      name: 'Zosia Kowalska',
      birthDate: '2016-05-10',
    });

    expect(screen.getByText('Dane podopiecznego')).toBeInTheDocument();
    expect(screen.getAllByText(/Zosia Kowalska/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Rok urodzenia/).textContent).toContain('2016');
    expect(screen.getByText('Dzieci 2014–2017', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(/nie podano/)).toBeInTheDocument();
    expect(screen.queryByText(/1990/)).not.toBeInTheDocument();
    expect(screen.queryByText('Mężczyzna')).not.toBeInTheDocument();
    expect(screen.queryByText('M30')).not.toBeInTheDocument();
  });

  // Regression guard: passes on the base commit too.
  it("keeps the guardian's own data for self-registration", async () => {
    await renderToPersonalData();

    expect(screen.getByText('Dane pobrane z profilu')).toBeInTheDocument();
    expect(screen.getByText(/Rok urodzenia/).textContent).toContain('1990');
    expect(screen.getByText('M30', { selector: 'p' })).toBeInTheDocument();
  });
});
