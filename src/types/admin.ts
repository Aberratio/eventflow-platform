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
