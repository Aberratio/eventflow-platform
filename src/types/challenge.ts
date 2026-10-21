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
 * A
 * Wyzwanie's completion rule is a tree of three leaf node types plus a
 * `group` composition node. AND is simply `requiredCount === children.length`
 * (a threshold is the same shape with a smaller `requiredCount`), so there is
 * one grouping mechanism, not a separate "AND" and "threshold" type.
 *
 * Points computation for `point_threshold`, automatic verification
 * and reward unlock all read this tree later — this ticket only
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
  /** "N best results" scoring parameter — structural only. */
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
  /** Condition tree — the same shape the server embeds via hydrate(). */
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

/**
 * One row of a Wyzwanie's or Serii's public ranking. `hasPoints` on the
 * parent response distinguishes a real point total from the binary
 * completed/not-completed fallback used when the Wyzwanie has no
 * `point_threshold` node anywhere in its condition tree (see
 * ChallengeRankingCalculator's doc comment server-side) — the UI labels the
 * points column differently depending on which case it got.
 */
export interface ChallengeRankingEntry {
  rank: number;
  /** Null for a ward without an account - never the caregiver's id. */
  userId: string | null;
  /** Ranking rows are per Zawodnik; use as the row key. */
  competitorId?: string | null;
  /** Real name, or the fixed anonymization label — never both. */
  name: string;
  isAnonymized: boolean;
  points: number;
  isCompleted: boolean;
}

export interface ChallengeRanking {
  hasPoints: boolean;
  entries: ChallengeRankingEntry[];
}

export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  /** The account that joined (mail recipient); for a ward it is the caregiver. */
  userId: string;
  /** The Zawodnik taking part; null for legacy rows with no profile. */
  competitorId?: string | null;
  competitorName?: string | null;
  userName: string;
  joinedAt: string;
  entries: ChallengeEntry[];
  completedCount: number;
  isCompleted: boolean;
  rewardGranted: boolean;
  rewardGrantedAt?: string;
  /**
   * Written by ChallengeRepository::claimReward() the
   * moment a reward order is created — one entry per claim (today always at
   * most one, since a challenge unlocks a single reward claim per
   * participation; the array shape matches the DB column's JSON so it can
   * grow without a migration if that ever changes).
   */
  selectedRewards?: Array<{
    productId: string;
    orderId: string;
    size?: string | null;
    color?: string | null;
    claimedAt: string;
  }>;
  assignedNumber?: number;
}
