export type ChallengeEntryStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface ChallengeRule {
  minCompleted: number;
  maxTime?: string;
}

export interface ChallengeReward {
  id: string;
  name: string;
  type: 'product' | 'free';
  productId?: string;
  price?: number;
  sizes?: string[];
  description?: string;
}

export interface ChallengeEvent {
  eventId: string;
  eventName: string;
  eventDate: string;
}

export interface Challenge {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  seriesId?: string;
  events: ChallengeEvent[];
  rule: ChallengeRule;
  rewards: ChallengeReward[];
  status: 'active' | 'completed' | 'upcoming';
  startDate?: string;
  endDate?: string;
  createdBy: string;
}

export interface ChallengeEntry {
  id: string;
  challengeId: string;
  userId: string;
  eventId: string;
  status: ChallengeEntryStatus;
  submittedTime?: string;
  submittedPosition?: number;
  proofUrl?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  joinedAt: string;
  entries: ChallengeEntry[];
  completedCount: number;
  isCompleted: boolean;
  rewardGranted: boolean;
  rewardGrantedAt?: string;
  selectedRewards?: Array<{
    rewardId: string;
    size?: string;
  }>;
  assignedNumber?: number;
}
