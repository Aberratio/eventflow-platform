import { afterEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import type {
  Distance,
  Event,
  EventResultDocument,
  GalleryAlbum,
  InfoPageSection,
  Partner,
  User,
} from '@/types';
import { GalleryAlbumsList } from '../GalleryAlbumsList';
import { LiveResultsBanner } from '../home/LiveResultsBanner';
import { PartnersSection } from '../home/PartnersSection';
import { CardsSection } from '../info/sections/CardsSection';
import { DistanceRouteDialog } from '../DistanceRouteDialog';
import { RouteMap } from '../RouteMap';
import { ResultDocumentsList } from '../results/ResultDocumentsList';
import { UserViewEditDialog } from '../admin/UserViewEditDialog';

const POISON = 'javascript:window.__xss=1';
const noDangerousAnchor = (container: HTMLElement) =>
  container.ownerDocument.querySelector('a[href^="javascript" i], a[href^="data:" i]');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GalleryAlbumsList', () => {
  const album = (url: string): GalleryAlbum => ({
    id: 'a1',
    name: 'Album startowy',
    url,
    platform: 'other',
  });

  it('does not link a javascript: album URL', () => {
    const { container } = render(<GalleryAlbumsList albums={[album(POISON)]} />);
    expect(noDangerousAnchor(container)).toBeNull();
    expect(screen.getByText('Album startowy')).toBeTruthy();
  });

  it('links an https album URL', () => {
    render(<GalleryAlbumsList albums={[album('https://photos.example/a')]} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://photos.example/a');
  });
});

describe('LiveResultsBanner', () => {
  const live = (liveResultsUrl: string): Event =>
    ({
      id: 'e1',
      name: 'Live Bieg',
      isLive: true,
      visibility: 'public',
      liveResultsUrl,
    }) as unknown as Event;

  it('does not link a javascript: live URL', () => {
    const { container } = render(<LiveResultsBanner events={[live(POISON)]} />);
    expect(noDangerousAnchor(container)).toBeNull();
  });

  it('links an https live URL', () => {
    render(<LiveResultsBanner events={[live('https://live.example/r')]} />);
    expect(screen.getByRole('link', { name: /Zobacz wyniki LIVE/i })).toHaveAttribute(
      'href',
      'https://live.example/r',
    );
  });
});

describe('PartnersSection', () => {
  const partner = (websiteUrl: string): Partner => ({
    id: 'p1',
    name: 'Partner',
    logoUrl: 'https://cdn.example/logo.png',
    websiteUrl,
    featured: true,
  });

  it('does not link a javascript: partner website', () => {
    const { container } = render(<PartnersSection partners={[partner(POISON)]} />);
    expect(noDangerousAnchor(container)).toBeNull();
  });

  it('links an https partner website', () => {
    render(<PartnersSection partners={[partner('https://partner.example')]} />);
    expect(screen.getByTitle('Partner')).toHaveAttribute('href', 'https://partner.example');
  });
});

describe('CardsSection', () => {
  const section = (link: string): InfoPageSection => ({
    id: 's1',
    type: 'cards',
    items: [{ id: 'i1', title: 'Karta', description: 'Opis', link }],
  });

  it('drops a javascript: card link', () => {
    const { container } = render(<CardsSection section={section(POISON)} />);
    expect(noDangerousAnchor(container)).toBeNull();
    expect(screen.queryByText(/Dowiedz się więcej/)).toBeNull();
  });

  it('keeps https and internal card links', () => {
    const first = render(<CardsSection section={section('/events')} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/events');
    first.unmount();
    render(<CardsSection section={section('https://example.com')} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com');
  });
});

describe('DistanceRouteDialog', () => {
  const distance = (gpx: string, fileUrl: string): Distance =>
    ({
      id: 'd1',
      name: '10 km',
      length: 10,
      unit: 'km',
      routeGpxUrl: gpx,
      routeFiles: [{ id: 'f1', name: 'Plik trasy', type: 'gpx', url: fileUrl }],
    }) as unknown as Distance;

  it('renders no dangerous download links', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<DistanceRouteDialog distance={distance(POISON, POISON)} />);
    await user.click(screen.getByRole('button', { name: /Zobacz trasę/i }));
    expect(await screen.findByText(/Pobierz plik GPX/i)).toBeTruthy();
    expect(baseElement.querySelector('a[href^="javascript" i]')).toBeNull();
  });

  it('renders https download links', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(
      <DistanceRouteDialog
        distance={distance('https://cdn.example/t.gpx', 'https://cdn.example/f.gpx')}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Zobacz trasę/i }));
    await screen.findByText(/Pobierz plik GPX/i);
    const hrefs = Array.from(baseElement.querySelectorAll('a[download]')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(['https://cdn.example/t.gpx', 'https://cdn.example/f.gpx']);
  });
});

describe('RouteMap', () => {
  it('does not link a javascript: GPX URL', () => {
    const { container } = render(<RouteMap mapUrl="https://cdn.example/m.png" gpxUrl={POISON} />);
    expect(noDangerousAnchor(container)).toBeNull();
  });

  it('links an https GPX URL', () => {
    render(<RouteMap mapUrl="https://cdn.example/m.png" gpxUrl="https://cdn.example/t.gpx" />);
    expect(screen.getByRole('link', { name: /Pobierz plik GPX/i })).toHaveAttribute(
      'href',
      'https://cdn.example/t.gpx',
    );
  });
});

describe('ResultDocumentsList', () => {
  const doc = (fileUrl: string): EventResultDocument => ({
    id: 'r1',
    eventId: 'e1',
    name: 'Wyniki OPEN',
    type: 'open',
    fileUrl,
    uploadedAt: '2027-05-02T10:00:00Z',
    uploadedBy: 'u1',
  });

  it('does not call window.open for a javascript: URL', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();
    render(<ResultDocumentsList documents={[doc(POISON)]} />);
    await user.click(screen.getByRole('button', { name: /PDF/ }));
    expect(open).not.toHaveBeenCalled();
  });

  it('opens an https URL with noopener,noreferrer', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();
    render(<ResultDocumentsList documents={[doc('https://cdn.example/w.pdf')]} />);
    await user.click(screen.getByRole('button', { name: /PDF/ }));
    expect(open).toHaveBeenCalledWith('https://cdn.example/w.pdf', '_blank', 'noopener,noreferrer');
  });
});

describe('UserViewEditDialog', () => {
  const organizer = (website: string): User =>
    ({
      id: 'u1',
      name: 'Org Anizator',
      email: 'org@example.test',
      role: 'organizer',
      status: 'active',
      website,
    }) as unknown as User;

  it('shows a javascript: website as text, not a link', () => {
    render(<UserViewEditDialog open onOpenChange={() => {}} user={organizer(POISON)} />);
    expect(screen.getByText(POISON)).toBeTruthy();
    expect(document.querySelector('a[href^="javascript" i]')).toBeNull();
  });

  it('links an https website', () => {
    render(
      <UserViewEditDialog open onOpenChange={() => {}} user={organizer('https://org.example')} />,
    );
    expect(screen.getByRole('link', { name: 'https://org.example' })).toHaveAttribute(
      'href',
      'https://org.example',
    );
  });
});
