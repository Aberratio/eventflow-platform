export type SeriesType = 'virtual' | 'local' | 'championship' | 'cup';

export interface EventSeries {
  id: string;
  name: string;
  slug: string;
  type: SeriesType;
  description: string;
  organizerId: string;
  organizerName: string;
  eventIds: string[];
  rules?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'completed' | 'upcoming' | 'archived';
  products?: Array<{
    productId: string;
    purpose: 'reward' | 'addon';
    sortOrder: number;
  }>;
}
