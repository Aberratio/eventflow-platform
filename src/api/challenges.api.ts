import { simulateDelay } from './client';
import type { ApiResponse } from './types';
import { mockChallenges, mockChallengeParticipations } from './mock/challenges.mock';
import type {
  Challenge,
  ChallengeParticipation,
  ChallengeEntry,
  ChallengeEntryStatus,
} from '@/types';

export async function getChallenges(): Promise<ApiResponse<Challenge[]>> {
  await simulateDelay();
  return { data: [...mockChallenges], success: true };
}

export async function getChallengeBySlug(slug: string): Promise<ApiResponse<Challenge | null>> {
  await simulateDelay();
  const ch = mockChallenges.find((c) => c.slug === slug) ?? null;
  return { data: ch, success: !!ch };
}

export async function getChallengeById(id: string): Promise<ApiResponse<Challenge | null>> {
  await simulateDelay();
  const ch = mockChallenges.find((c) => c.id === id) ?? null;
  return { data: ch, success: !!ch };
}

export async function getChallengeParticipations(
  challengeId?: string,
  userId?: string,
): Promise<ApiResponse<ChallengeParticipation[]>> {
  await simulateDelay();
  let result = [...mockChallengeParticipations];
  if (challengeId) result = result.filter((p) => p.challengeId === challengeId);
  if (userId) result = result.filter((p) => p.userId === userId);
  return { data: result, success: true };
}

export async function joinChallenge(
  challengeId: string,
): Promise<ApiResponse<ChallengeParticipation>> {
  await simulateDelay();
  const participation: ChallengeParticipation = {
    id: `cp-${Date.now()}`,
    challengeId,
    userId: '',
    userName: '',
    joinedAt: new Date().toISOString(),
    entries: [],
    completedCount: 0,
    isCompleted: false,
    rewardGranted: false,
  };
  return { data: participation, success: true };
}

export async function submitChallengeEntry(
  data: Partial<ChallengeEntry>,
): Promise<ApiResponse<ChallengeEntry>> {
  await simulateDelay();
  const entry: ChallengeEntry = {
    id: `ce-${Date.now()}`,
    challengeId: '',
    userId: '',
    eventId: '',
    status: 'pending',
    submittedAt: new Date().toISOString(),
    ...data,
  } as ChallengeEntry;
  return { data: entry, success: true };
}

export async function reviewChallengeEntry(
  entryId: string,
  status: ChallengeEntryStatus,
  reason?: string,
): Promise<ApiResponse<ChallengeEntry>> {
  await simulateDelay();
  void entryId;
  const entry: ChallengeEntry = {
    id: entryId,
    challengeId: '',
    userId: '',
    eventId: '',
    status,
    rejectionReason: reason,
    reviewedAt: new Date().toISOString(),
  } as ChallengeEntry;
  return { data: entry, success: true };
}
