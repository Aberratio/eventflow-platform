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
