import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render, resetQueryClient } from '@/test/test-utils';
import ParticipantChallengesTab from '../ParticipantChallengesTab';

const getChallengeParticipations = vi.fn();
const getChallenges = vi.fn();
const getCare = vi.fn();
const joinChallenge = vi.fn();

vi.mock('@/api', () => ({
  getChallengeParticipations: (...args: unknown[]) => getChallengeParticipations(...args),
  getChallenges: (...args: unknown[]) => getChallenges(...args),
  getCare: (...args: unknown[]) => getCare(...args),
  joinChallenge: (...args: unknown[]) => joinChallenge(...args),
}));

vi.mock('@/contexts/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/contexts/AuthContext')>()),
  useAuth: () => ({ user: { id: 'user-1', role: 'participant' } }),
}));

const challenge = (id: string, name: string) => ({
  id,
  name,
  slug: id,
  status: 'active',
  rule: { minCompleted: 2 },
  events: [{ eventId: 'e1' }, { eventId: 'e2' }],
});

const participation = (id: string, challengeId: string, competitorId: string, name: string) => ({
  id,
  challengeId,
  userId: 'user-1',
  competitorId,
  competitorName: name,
  userName: name,
  joinedAt: '2026-01-01',
  entries: [],
  completedCount: 1,
  isCompleted: false,
  rewardGranted: false,
});

describe('ParticipantChallengesTab (R-06: challenges of wards)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetQueryClient();
    getChallenges.mockResolvedValue({
      data: [challenge('c1', 'Korona Gór'), challenge('c2', 'Grand Prix Zimy')],
    });
    getCare.mockResolvedValue({
      data: {
        myProfile: { id: 'comp-self', firstName: 'Jan', lastName: 'Testowy' },
        myCompetitors: [
          {
            id: 'rel-1',
            competitorId: 'comp-ward',
            firstName: 'Zosia',
            lastName: 'Testowa',
            createdAt: '2026-01-01',
          },
        ],
        caregivers: [],
      },
    });
    getChallengeParticipations.mockResolvedValue({
      data: [
        participation('p1', 'c1', 'comp-self', 'Jan Testowy'),
        participation('p2', 'c1', 'comp-ward', 'Zosia Testowa'),
      ],
    });
  });

  it('groups challenges by competitor and names the ward', async () => {
    render(<ParticipantChallengesTab />);

    expect(await screen.findByRole('heading', { name: 'Zosia Testowa' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Jan Testowy (Ty)' })).toBeInTheDocument();
    expect(getChallengeParticipations).toHaveBeenCalledWith(undefined, 'user-1');
    expect(screen.getAllByText('Korona Gór').length).toBeGreaterThanOrEqual(2);
  });

  it('lets the caregiver join a challenge for a ward, excluding challenges the ward already joined', async () => {
    joinChallenge.mockResolvedValue({
      data: participation('p3', 'c2', 'comp-ward', 'Zosia Testowa'),
    });
    render(<ParticipantChallengesTab />);

    const wardSelect = await screen.findByLabelText('Zawodnik');
    fireEvent.change(wardSelect, { target: { value: 'comp-ward' } });

    const challengeSelect = screen.getByLabelText('Wyzwanie');
    const options = Array.from(challengeSelect.querySelectorAll('option')).map(
      (o) => o.textContent,
    );
    expect(options).toContain('Grand Prix Zimy');
    expect(options).not.toContain('Korona Gór');

    fireEvent.change(challengeSelect, { target: { value: 'c2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz na wyzwanie' }));

    await waitFor(() => expect(joinChallenge).toHaveBeenCalledWith('c2', 'comp-ward'));
  });

  it('shows no join form for an account without wards', async () => {
    getCare.mockResolvedValue({
      data: { myProfile: { id: 'comp-self' }, myCompetitors: [], caregivers: [] },
    });
    getChallengeParticipations.mockResolvedValue({
      data: [participation('p1', 'c1', 'comp-self', 'Jan Testowy')],
    });
    render(<ParticipantChallengesTab />);

    expect(await screen.findByText('Korona Gór')).toBeInTheDocument();
    expect(screen.queryByLabelText('Zawodnik')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Jan Testowy/ })).not.toBeInTheDocument();
  });
});
