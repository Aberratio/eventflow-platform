export type UserRole = 'participant' | 'organizer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type SportDiscipline = 'running' | 'cycling' | 'triathlon' | 'multisport';

export interface PriceTier {
  id: string;
  name: string;
  price: number;
  endDate: string;
  description?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  validFrom?: string;
  validTo?: string;
  maxUses?: number;
  usedCount: number;
  distanceIds?: string[];
  active: boolean;
}

export interface MerchandiseOrder {
  merchandiseId: string;
  merchandiseName: string;
  size?: string;
  color?: string;
  colorHex?: string;
  quantity: number;
  price: number;
}

export interface Distance {
  id: string;
  name: string;
  length: number;
  unit: 'km' | 'm';
  categories: string[];
  limit?: number;
  registeredCount: number;
  price: number;
  priceTiers?: PriceTier[];
}

export interface OrganizerContact {
  email: string;
  phone?: string;
  website?: string;
}

export interface InsuranceOption {
  id: string;
  name: string;
  description: string;
  baseFee: number;
  ageMultiplier: number;
  maxAge: number;
  enabled: boolean;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  discipline: SportDiscipline;
  date: string;
  location: string;
  city: string;
  description: string;
  imageUrl: string;
  distances: Distance[];
  organizerId: string;
  organizerName: string;
  organizerContact?: OrganizerContact;
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  registrationDeadline: string;
  featured: boolean;
  liveResultsUrl?: string;
  paymentMethods?: PaymentMethod[];
  merchandise?: EventMerchandise[];
  discountCodes?: DiscountCode[];
  enableMerchandiseInRegistration?: boolean;
  insuranceOption?: InsuranceOption;
}

export interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
}

export interface MerchandiseColor {
  id: string;
  name: string;
  hex: string;
}

export interface EventMerchandise {
  id: string;
  name: string;
  description?: string;
  price: number;
  sizes: string[];
  colors: MerchandiseColor[];
  imageUrl?: string;
  available: boolean;
}

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  featured: boolean;
}

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
  status: 'pending' | 'confirmed' | 'cancelled';
  bibNumber?: string;
  teamName?: string;
  pricePaid?: number;
  discountCode?: string;
  discountAmount?: number;
  merchandiseOrders?: MerchandiseOrder[];
  insurancePaid?: number;
}

export interface Result {
  id: string;
  eventId: string;
  eventName: string;
  distanceId: string;
  distanceName: string;
  userId: string;
  userName: string;
  bibNumber: string;
  category: string;
  time: string;
  timeInSeconds: number;
  position: number;
  categoryPosition: number;
  status: 'finished' | 'dnf' | 'dsq';
}

export interface PersonalRecord {
  distance: string;
  time: string;
  eventName: string;
  date: string;
}

export interface Certificate {
  id: string;
  eventId: string;
  eventName: string;
  date: string;
  distance: string;
  time: string;
  position: number;
  downloadUrl: string;
}

export interface Message {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  subject: string;
  content: string;
  sentAt: string;
  read: boolean;
  eventId?: string;
}
