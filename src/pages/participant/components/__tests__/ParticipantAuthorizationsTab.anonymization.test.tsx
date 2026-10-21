import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '@/test/test-utils';
import ParticipantAuthorizationsTab from '../ParticipantAuthorizationsTab';
import type { CareResponse } from '@/types';

const getCare = vi.fn();
const setCompetitorAnonymization = vi.fn();

vi.mock('@/api', () => ({
  getCare: (...args: unknown[]) => getCare(...args),
  grantCareByEmail: vi.fn(),
  addCompetitor: vi.fn(),
  revokeCare: vi.fn(),
  rotateIdentityCode: vi.fn(),
  setCompetitorAnonymization: (...args: unknown[]) => setCompetitorAnonymization(...args),
}));

const careResponse: CareResponse = {
  myProfile: {
    id: 'competitor-self',
    firstName: 'Jan',
    lastName: 'Testowy',
    identityCode: `zqr_${'a'.repeat(48)}`,
    userId: 'user-1',
    isAnonymized: false,
  },
  myCompetitors: [
    {
      id: 'care-relation-1',
      competitorId: 'competitor-ward',
      createdAt: '2026-01-01T00:00:00Z',
      firstName: 'Zosia',
      lastName: 'Testowa',
      identityCode: `zqr_${'b'.repeat(48)}`,
      competitorUserId: null,
      isAnonymized: true,
    },
  ],
  caregivers: [],
};

// Self-service anonymization toggle for the own profile and for wards.
describe('ParticipantAuthorizationsTab anonymization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCare.mockResolvedValue({ data: careResponse });
  });

  it('shows the current state of each profile', async () => {
    render(<ParticipantAuthorizationsTab />);

    const own = await screen.findByRole('switch', { name: /Anonimizuj: Ja/ });
    const ward = screen.getByRole('switch', { name: /Anonimizuj: Zosia Testowa/ });
    expect(own).not.toBeChecked();
    expect(ward).toBeChecked();
  });

  it('turns anonymization on through the API', async () => {
    setCompetitorAnonymization.mockResolvedValue({
      data: { ...careResponse.myProfile, isAnonymized: true },
    });
    render(<ParticipantAuthorizationsTab />);

    fireEvent.click(await screen.findByRole('switch', { name: /Anonimizuj: Ja/ }));

    await waitFor(() =>
      expect(setCompetitorAnonymization).toHaveBeenCalledWith('competitor-self', true),
    );
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: /Anonimizuj: Ja/ })).toBeChecked(),
    );
  });

  it('turns anonymization off for a ward', async () => {
    setCompetitorAnonymization.mockResolvedValue({ data: { isAnonymized: false } });
    render(<ParticipantAuthorizationsTab />);

    fireEvent.click(await screen.findByRole('switch', { name: /Anonimizuj: Zosia Testowa/ }));

    await waitFor(() =>
      expect(setCompetitorAnonymization).toHaveBeenCalledWith('competitor-ward', false),
    );
  });
});
