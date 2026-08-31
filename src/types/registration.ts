import type { MerchandiseOrder, PaymentDetails } from './event';

/**
 * One line of the frozen Rozliczenie (settlement) the server computes and
 * attaches to a Zapis — name, basis, amount, freeze timestamp (E1.2,
 * resolution #14). The client never computes these; it only displays them
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

export interface Registration {
  id: string;
  eventId: string;
  eventName: string;
  userId: string;
  /** Zawodnik będący źródłem tożsamości zapisu (E0.1) — identyfikator, nie kopiowana nazwa. */
  competitorId?: string;
  userName: string;
  userEmail: string;
  distanceId: string;
  distanceName: string;
  category: string;
  registeredAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'removed';
  bibNumber?: string;
  teamName?: string;
  teamId?: string;
  pricePaid?: number;
  discountCode?: string;
  discountAmount?: number;
  merchandiseOrders?: MerchandiseOrder[];
  insurancePaid?: number;
  totalAmount?: number;
  /** Server-computed, position-by-position Rozliczenie (E1.2). */
  settlementItems?: SettlementItem[];
  removedAt?: string;
  paymentDetails?: PaymentDetails;
  registeredById?: string;
}
