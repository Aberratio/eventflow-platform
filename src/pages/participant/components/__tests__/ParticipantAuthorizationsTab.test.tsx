import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '@/test/test-utils';
import ParticipantAuthorizationsTab from '../ParticipantAuthorizationsTab';
import type { CareResponse } from '@/types';

const getCare = vi.fn();
const grantCareByEmail = vi.fn();
const addCompetitor = vi.fn();
const revokeCare = vi.fn();
const rotateIdentityCode = vi.fn();

vi.mock('@/api', () => ({
  getCare: (...args: unknown[]) => getCare(...args),
  grantCareByEmail: (...args: unknown[]) => grantCareByEmail(...args),
  addCompetitor: (...args: unknown[]) => addCompetitor(...args),
  revokeCare: (...args: unknown[]) => revokeCare(...args),
  rotateIdentityCode: (...args: unknown[]) => rotateIdentityCode(...args),
}));

const myIdentityCode = `zqr_${'a'.repeat(48)}`;
const wardIdentityCode = `zqr_${'b'.repeat(48)}`;

const careResponse: CareResponse = {
  myProfile: {
    id: 'competitor-self',
    firstName: 'Jan',
    lastName: 'Testowy',
    identityCode: myIdentityCode,
    userId: 'user-1',
  },
  myCompetitors: [
    {
      id: 'care-relation-1',
      competitorId: 'competitor-ward',
      createdAt: '2026-01-01T00:00:00Z',
      firstName: 'Zosia',
      lastName: 'Testowa',
      identityCode: wardIdentityCode,
      competitorUserId: null,
    },
  ],
  caregivers: [],
};

describe('ParticipantAuthorizationsTab identity code (E1.12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCare.mockResolvedValue({ data: careResponse });
  });

  it('shows the own identity code QR and raw token by default', async () => {
    render(<ParticipantAuthorizationsTab />);

    await waitFor(() => expect(screen.getByText(myIdentityCode)).toBeInTheDocument());
  });

  it("lets a guardian switch to see a ward's own identity code", async () => {
    render(<ParticipantAuthorizationsTab />);

    await waitFor(() => expect(screen.getByText(myIdentityCode)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Zosia Testowa' }));

    expect(screen.getByText(wardIdentityCode)).toBeInTheDocument();
    expect(screen.queryByText(myIdentityCode)).not.toBeInTheDocument();
  });

  it('calls rotateIdentityCode with the active identity\'s competitor id on "Wygeneruj nowy"', async () => {
    rotateIdentityCode.mockResolvedValue({
      data: { ...careResponse.myProfile, identityCode: `zqr_${'c'.repeat(48)}` },
    });

    render(<ParticipantAuthorizationsTab />);

    await waitFor(() => expect(screen.getByText(myIdentityCode)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Wygeneruj nowy/ }));

    await waitFor(() => expect(rotateIdentityCode).toHaveBeenCalledWith('competitor-self'));
  });

  it('renders nothing for the identity-code card when there is no profile and no wards', async () => {
    getCare.mockResolvedValue({ data: { myProfile: null, myCompetitors: [], caregivers: [] } });

    render(<ParticipantAuthorizationsTab />);

    await waitFor(() =>
      expect(screen.getByText('Nie masz jeszcze nikogo pod opieką.')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Kod tożsamości QR')).not.toBeInTheDocument();
  });
});
