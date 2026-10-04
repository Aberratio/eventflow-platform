import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import OrganizerProfileTab from '../OrganizerProfileTab';

vi.mock('@/api', () => ({
  changePassword: vi.fn(),
  requestEmailChange: vi.fn(),
  uploadAvatar: vi.fn(),
  resendEmailVerification: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: 'org-1',
        name: 'Olek Organizator',
        email: 'olek@example.test',
        role: 'organizer',
      },
      updateCurrentUser: vi.fn(),
    }),
  };
});

describe('OrganizerProfileTab', () => {
  it('renders the password and e-mail change cards', () => {
    render(<OrganizerProfileTab />);

    expect(screen.getByRole('heading', { name: 'Zmiana hasła' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zmień hasło' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Zmień adres e-mail' })).toBeInTheDocument();
  });
});
