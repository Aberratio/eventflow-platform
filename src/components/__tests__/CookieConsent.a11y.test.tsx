import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieConsent } from '../CookieConsent';

describe('CookieConsent a11y (WCAG 4.1.2, 2.1.2)', () => {
  beforeEach(() => localStorage.clear());

  it('banner is a labelled region, not a dialog', () => {
    render(<CookieConsent />);
    expect(screen.getByRole('region', { name: 'Zgoda na pliki cookies' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('"Dostosuj" opens a named dialog whose switches have names', async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);
    await user.click(screen.getByRole('button', { name: /Dostosuj/ }));
    expect(screen.getByRole('dialog', { name: 'Ustawienia cookies' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Analityczne' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Niezbędne' })).toBeDisabled();
  });

  it('Escape in the dialog returns to the banner when no consent was saved', async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);
    await user.click(screen.getByRole('button', { name: /Dostosuj/ }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Zgoda na pliki cookies' })).toBeInTheDocument();
  });

  it('opened from the footer after consent: Escape closes everything', async () => {
    const user = userEvent.setup();
    localStorage.setItem('cookie-consent', JSON.stringify({ analytics: false }));
    render(<CookieConsent />);
    window.dispatchEvent(new Event('open-cookie-settings'));
    expect(await screen.findByRole('dialog', { name: 'Ustawienia cookies' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
