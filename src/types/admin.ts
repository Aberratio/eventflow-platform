/** Sales dashboard statistics returned by the admin API. */
export interface MonthlyRevenue {
  readonly month: string;
  readonly revenue: number;
}

export interface TopProduct {
  readonly id: string;
  readonly name: string;
  readonly sold: number;
  readonly revenue: number;
}

export interface OrderStatusBreakdown {
  readonly status: string;
  readonly count: number;
  readonly fill: string;
}

export interface SalesStats {
  readonly monthlyRevenue: MonthlyRevenue[];
  readonly topProducts: TopProduct[];
  readonly ordersByStatus: OrderStatusBreakdown[];
}

/**
 * E8.3 (spec 21 Answer §6): the minimal platform-admin cross-section —
 * Events by publication_status (E1.1), Organizer count, and the active
 * package-credit total (E5.6, `users.organizer_package_credits` summed
 * across all users — each unit of credit is one still-unconsumed package).
 */
export interface PlatformStatsEventStatusCount {
  readonly status: string;
  readonly count: number;
}

export interface PlatformStats {
  readonly eventsByStatus: PlatformStatsEventStatusCount[];
  readonly organizerCount: number;
  readonly activePackageCredits: number;
}

/**
 * R-03 (spec 13, trasa A): raport rozliczeniowy admina — wpłaty bramką minus zwroty minus
 * prowizja = kwota do ręcznej wypłaty dla organizatora. Wszystkie kwoty w groszach (int).
 */
export interface SettlementTotals {
  readonly paymentsCount: number;
  readonly refundsCount: number;
  readonly grossMinor: number;
  readonly refundsMinor: number;
  readonly commissionMinor: number;
  readonly netMinor: number;
}

export interface SettlementEventTotals extends SettlementTotals {
  readonly eventId: string;
  readonly eventName: string;
  readonly organizerName: string;
}

export interface SettlementLine {
  readonly type: 'payment' | 'refund';
  readonly occurredAt: string;
  readonly eventId: string;
  readonly eventName: string;
  readonly organizerName: string;
  readonly registrationId: string;
  readonly bibNumber: string | null;
  readonly participantName: string;
  readonly gateway: string;
  readonly reference: string;
  readonly amountMinor: number;
  readonly commissionMinor: number;
}

export interface SettlementReport {
  readonly period: { readonly dateFrom: string; readonly dateTo: string };
  readonly commissionRateBps: number;
  readonly summary: SettlementTotals;
  readonly events: SettlementEventTotals[];
  readonly lines: SettlementLine[];
}

export interface SettlementReportParams {
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly eventId?: string;
}
