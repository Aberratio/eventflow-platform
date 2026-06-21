import type { MerchandiseOrder, PaymentDetails } from './event';

export interface Registration {
  id: string;
  eventId: string;
  eventName: string;
  userId: string;
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
  removedAt?: string;
  paymentDetails?: PaymentDetails;
  registeredById?: string;
}
