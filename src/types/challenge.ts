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

/**
 * E6.1 (issue 15 §1): "drzewo warunków, nie jeden płaski próg" — a
 * Wyzwanie's completion rule is a tree of three leaf node types plus a
 * `group` composition node. AND is simply `requiredCount === children.length`
 * (a threshold is the same shape with a smaller `requiredCount`), so there is
 * one grouping mechanism, not a separate "AND" and "threshold" type.
 *
 * Points computation for `point_threshold` (E6.2), automatic verification
 * (E6.3) and reward unlock (E6.5) all read this tree later — this ticket only
 * builds and edits its shape.
 */
export type ChallengeConditionNodeType =
  | 'group'
  | 'event_threshold'
  | 'point_threshold'
  | 'sub_challenge_threshold';

export interface ChallengeConditionNodeEventRef {
  eventId: string;
  eventName?: string;
  eventDate?: string;
}

export interface ChallengeConditionSubChallengeRef {
  challengeId: string;
  name?: string;
}

export interface ChallengeConditionNode {
  type: ChallengeConditionNodeType;
  /** N in "ukończ >= N spośród M" — for `group`, N of its `children`. */
  requiredCount?: number | null;
  /** X in "zbierz >= X punktów" — `point_threshold` only. */
  pointsRequired?: number | null;
  /** "N best results" scoring parameter — structural only, see E6.2. */
  bestResultsCount?: number | null;
  /** Optional completion window (ISO date), e.g. "w tym roku kalendarzowym". */
  windowStart?: string | null;
  windowEnd?: string | null;
  /** `event_threshold` / `point_threshold` only — this node's OWN event set. */
  events?: ChallengeConditionNodeEventRef[];
  /** `sub_challenge_threshold` only. */
  subChallenges?: ChallengeConditionSubChallengeRef[];
  /** `group` only. */
  children?: ChallengeConditionNode[];
}

export interface Challenge {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  seriesId?: string;
  events: ChallengeEvent[];
  products?: Array<{
    productId: string;
    purpose: 'reward' | 'addon';
    sortOrder: number;
  }>;
  rule: ChallengeRule;
  rewards: ChallengeReward[];
  status: 'active' | 'completed' | 'upcoming' | 'archived';
  startDate?: string;
  endDate?: string;
  createdBy: string;
  /** E6.1 condition tree — the same shape the server embeds via hydrate(). */
  conditionTree?: ChallengeConditionNode | null;
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
