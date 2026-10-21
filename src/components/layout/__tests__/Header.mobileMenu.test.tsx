import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Header } from '../Header';

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );

describe('Header mobile menu (R-16)', () => {
  it('closes on Escape and returns focus to the menu button', async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole('button', { name: 'Otwórz menu' }));
    expect(document.getElementById('mobile-nav-menu')).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.getElementById('mobile-nav-menu')).toBeNull();
    const button = screen.getByRole('button', { name: 'Otwórz menu' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('Escape does nothing when the menu is closed', () => {
    renderHeader();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Otwórz menu' })).not.toHaveFocus();
  });
});
