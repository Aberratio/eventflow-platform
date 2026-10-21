import type { MerchandiseOrder, PaymentDetails } from './event';

/**
 * One line of the frozen Rozliczenie (settlement) the server computes and
 * attaches to a Zapis — name, basis, amount, freeze timestamp). The client never computes these; it only displays them
 * once the server returns them on create/fetch.
 */
export interface SettlementItem {
  id: string;
  name: string;
  basis: string;
  amount: number;
  frozenAt: string;
  sortOrder: number;
}

/**
 * The refund cycle currently on file for this Zapis, if any — layered on top
 * of `status` (paid/confirmed), not a replacement for it. `requested` (the Zawodnik
 * asked) -> `approved` ("do zwrotu", approved by the organizer/admin) -> `refunded`
 * (route A: gateway, not built yet; route B: the organizer marks it manually, fully
 * built). `amount` is the server-computed saldo
 * (never client-supplied) — the client only ever displays it.
 */
/**
 * An entry in the history of a Zapis (`GET /registrations/{id}/changes`). `from`/`to` are
 * snapshots that depend on the type — cancellation: `{ status, distanceId }` → `{ status, refundRequested }`.
 */
export interface RegistrationChange {
  id: string;
  registrationId: string;
  type: 'cancelled' | 'distance_changed' | 'transferred';
  from: Record<string, unknown> | null;
  to: Record<string, unknown> | null;
  actorId: string | null;
  actorRole: string | null;
  createdAt: string;
}

export interface RefundState {
  status: 'requested' | 'approved' | 'refunded';
  requestedAt?: string;
  requestedBy?: string;
  reason?: string;
  approvedAt?: string;
  approvedBy?: string;
  amount?: number;
  route?: 'gateway' | 'manual';
  completedAt?: string;
  completedBy?: string;
}

/**
 * A real, server-validated Drużyna — the roster
 * entity behind `Registration.teamId`/`teamName` for a relay Dystans.
 * `memberCount`/`complete` are derived server-side on every read (never a
 * settable field): a Drużyna with fewer Zapisy than `maxSize` is a legal,
 * "incomplete" state, not an error — see TeamRepository (server) for the
 * exact completeness rule (`memberCount >= maxSize`).
 */
export interface RelayTeam {
  id: string;
  eventId: string;
  distanceId: string;
  name: string;
  memberCount: number;
  minSize: number | null;
  maxSize: number | null;
  complete: boolean | null;
  /** The user who created the team — the "captain" for permission checks. */
  createdByUserId?: string | null;
  /**
   * The captain's manually declared Kategoria
   * specjalna, e.g. "Drużyna mieszana" — set once at creation, optionally
   * changed later by the captain, and NEVER recomputed from the roster.
   */
  specialCategory?: string | null;
}

/**
 * The captain's invitation for one Drużyna — read only by the captain and by
 * staff who manage the event (`GET /teams/{teamId}/invite`). `inviteToken` is a bearer secret,
 * separate from the (public) team id.
 */
export interface TeamInvite {
  teamId: string;
  eventId: string;
  distanceId: string;
  inviteToken: string;
}

/**
 * One active Zapis on a Drużyna's roster, as the captain / the event's manager sees it when
 * choosing whom to swap out (`GET /teams/{teamId}/members`).
 */
export interface TeamMember {
  registrationId: string;
  name: string;
  status: string;
  bibNumber: string | null;
  competitorId: string | null;
}

/** Returned only by POST /registrations for a fresh `pending` trasa-A Zapis when a gateway session was opened. */
export interface PaymentSession {
  transactionId: string;
  redirectUrl: string;
}

export interface Registration {
  id: string;
  eventId: string;
  eventName: string;
  userId: string;
  /** The Zawodnik that is the identity source of the Zapis — an identifier, not a copied name. */
  competitorId?: string;
  userName: string;
  userEmail: string;
  distanceId: string;
  distanceName: string;
  category: string;
  registeredAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'removed' | 'expired';
  bibNumber?: string;
  teamName?: string;
  teamId?: string;
  pricePaid?: number;
  discountCode?: string;
  discountAmount?: number;
  merchandiseOrders?: MerchandiseOrder[];
  insurancePaid?: number;
  totalAmount?: number;
  /** Server-computed, position-by-position Rozliczenie. */
  settlementItems?: SettlementItem[];
  removedAt?: string;
  paymentDetails?: PaymentDetails;
  /** Present only on the POST /registrations response, when a gateway session was opened. */
  paymentSession?: PaymentSession | null;
  /**
   * End of the payment window of a `pending` Zapis (ISO). NOTE: the server does not serialise it
   * yet (column registrations.payment_expires_at) — the banner degrades to "dokończ płatność" without a date.
   */
  paymentExpiresAt?: string | null;
  /**
   * True on the POST /registrations response of a dry run (a Draft in test mode). The
   * Zapis does not exist (the `id` is a ghost), nothing was paid; only the Rozliczenie is real.
   */
  isTest?: boolean;
  registeredById?: string;
  /** Refund state machine — null/undefined means no refund cycle has ever started. */
  refund?: RefundState | null;
  /**
   * Server-computed, deterministic bank-transfer title for trasa B
   * (`ZC-{id}`) — used to match incoming bank transfers to this Zapis.
   * Always present regardless of payment route (trasa A ignores it).
   */
  transferTitle?: string;
  /**
   * Platform-generated QR start code (`pqr_` + 48 hex chars) belonging to
   * this Zapis — the same format Biuro Zawodów's own offline scanner already
   * expects (`^pqr_[a-f0-9]{48}$}`), just generated by the platform instead.
   * Distinct from the (not-yet-built) `zqr_` identity code, which belongs
   * to the Zawodnik, not the Zapis. Carries no status of its own — its validity
   * on the day follows `status` above, not a separate flag. Always present
   * (every Zapis gets one at creation), so the client never has to special-case
   * its absence — same convention as `transferTitle`.
   */
  qrCode?: string;
  /**
   * Set once Biuro Zawodów reports back that this Zapis was checked in on-site
   * (return-synced via PATCH /bz/participants/{registrationId}), undefined/null
   * beforehand. `checkedInBy` is BZ's own opaque identifier/name for whoever
   * confirmed it, not a platform user.
   */
  checkedInAt?: string | null;
  checkedInBy?: string | null;
}

/** One organizer-opted public form field on a start-list entry. */
export interface PublicStartListField {
  fieldKey: string;
  label: string;
  value: unknown;
}

/**
 * The only shape `GET /events/{id}/start-list` returns — a hard
 * allowlist (server: RegistrationRepository::PUBLIC_START_LIST_FIELDS), never
 * userEmail/qrCode/discountCode/checkedInBy or any other financial/PII field
 * a full Registration carries.
 */
export interface PublicStartListEntry {
  id: string;
  distanceId: string;
  distanceName: string;
  category: string;
  /** null for an anonymized competitor — never link to their profile. */
  userId: string | null;
  userName: string;
  bibNumber?: string | null;
  teamName?: string | null;
  teamId?: string | null;
  status: Registration['status'];
  registeredAt: string;
  hasMerchandise: boolean;
  formFields: PublicStartListField[];
}

/**
 * The numbers of a change of Dystans — the response of `POST /registrations/{id}/distance-change/quote`
 * and the `change` part of the change itself. Money in PLN, `*Minor` in grosze. `blockedReason` is set when
 * this caller may not (or cannot yet) make the change, e.g. `balance_due_requires_organizer` for a dearer Dystans.
 */
export interface DistanceChangeQuote {
  registrationId: string;
  from: { distanceId: string; distanceName: string };
  to: { distanceId: string; distanceName: string };
  category: string;
  currentTotal: number;
  newTotal: number;
  paidAmount: number;
  /** newTotal − paidAmount for a paid Zapis; 0 for an unpaid one. */
  balance: number;
  balanceDueMinor: number;
  refundDueMinor: number;
  settlementItems: { name: string; basis: string; amount: number }[];
  discountDropped: boolean;
  bibCleared: boolean;
  blockedReason: string | null;
  blockedMessage: string | null;
}

/** The changed Zapis plus what the change cost (`POST /registrations/{id}/distance-change`). */
export type DistanceChangeResult = Registration & {
  balanceDueMinor: number;
  refundDueMinor: number;
  refundRequested: boolean;
  change: DistanceChangeQuote;
};

/**
 * The Zapis after `POST /registrations/{id}/transfer`. Nothing is paid or refunded by
 * the transfer: `balanceDueMinor` / `overpaymentMinor` (grosze) only report what the new person's NNW
 * insurance changed, for the organizer to settle by hand.
 */
export type TransferRegistrationResult = Registration & {
  balanceDueMinor: number;
  overpaymentMinor: number;
  transfer: {
    from: { competitorId: string; name: string };
    to: { competitorId: string; name: string };
    changeId: string;
  };
};

/** One line of the Rozliczenie a Zapis would get — the response of `POST /registrations/quote`. */
export interface RegistrationQuoteItem {
  name: string;
  basis: string;
  amount: number;
}

/**
 * The price the server would freeze for this payload right now, without creating the Zapis.
 * Binding only as a preview — the Zapis created afterwards recomputes the same way.
 */
export interface RegistrationQuote {
  eventName: string;
  distanceName: string;
  settlementItems: RegistrationQuoteItem[];
  totalAmount: number;
  discountCode: string | null;
}
