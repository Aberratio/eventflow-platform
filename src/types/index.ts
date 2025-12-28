export type UserRole = 'participant' | 'organizer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type SportDiscipline = 'running' | 'cycling' | 'triathlon' | 'multisport';

export interface Distance {
  id: string;
  name: string;
  length: number;
  unit: 'km' | 'm';
  categories: string[];
  limit?: number;
  registeredCount: number;
  price: number;
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
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  registrationDeadline: string;
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
