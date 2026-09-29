import { describe, expect, it } from 'vitest';
import { render } from '@/test/test-utils';
import type { Event } from '@/types';
import { ExternalRegistrationFrame } from '../ExternalRegistrationFrame';

const eventWith = (externalUrl: string): Event =>
  ({
    id: 'e1',
    name: 'Bieg testowy',
    registrationEmbed: { enabled: true, mode: 'external_embed', externalUrl },
  }) as unknown as Event;

const dangerousLink = (container: HTMLElement) =>
  container.querySelector('a[href^="javascript" i], a[href^="data" i], a[href^="vbscript" i]');

describe('ExternalRegistrationFrame (PP.50)', () => {
  it('renders no iframe and no link for a javascript: URL, and shows the Polish notice', () => {
    const { container, getByText } = render(
      <ExternalRegistrationFrame event={eventWith('javascript:window.__xss=1')} active />,
    );
    expect(container.querySelector('iframe')).toBeNull();
    expect(dangerousLink(container)).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(getByText('Zapisy są niedostępne')).toBeTruthy();
    expect(getByText(/Adres zewnętrznego formularza zapisów jest nieprawidłowy/)).toBeTruthy();
  });

  it('renders the iframe and the link for an https URL', () => {
    const { container } = render(
      <ExternalRegistrationFrame event={eventWith('https://example.com/form')} active />,
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe('https://example.com/form');
    expect(container.querySelector('a')?.getAttribute('href')).toBe('https://example.com/form');
  });

  it('does not frame a relative URL', () => {
    const { container } = render(
      <ExternalRegistrationFrame event={eventWith('/relative')} active />,
    );
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('normalises a bare host to https', () => {
    const { container } = render(
      <ExternalRegistrationFrame event={eventWith('www.example.pl/form')} active />,
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.example.pl/form',
    );
  });

  it('keeps the closed-reason text for a valid URL when inactive', () => {
    const { container, getByText } = render(
      <ExternalRegistrationFrame
        event={eventWith('https://example.com/form')}
        active={false}
        closedReason="Zapisy zamknięte"
      />,
    );
    expect(container.querySelector('iframe')).toBeNull();
    expect(getByText('Zapisy zamknięte')).toBeTruthy();
  });
});
