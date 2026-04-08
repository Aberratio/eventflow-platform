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
  gender?: 'M' | 'K';
  birthYear?: number;
}

export interface TeamResult {
  id: string;
  eventId: string;
  distanceId: string;
  distanceName: string;
  teamName: string;
  members: Array<{
    userId: string;
    userName: string;
    time: string;
    timeInSeconds: number;
  }>;
  totalTime: string;
  totalTimeInSeconds: number;
  position: number;
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

export type VirtualResultSubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface VirtualResultSubmission {
  id: string;
  eventId: string;
  eventName: string;
  distanceId: string;
  distanceName: string;
  userId: string;
  userName: string;
  userEmail: string;
  submittedTime: string;
  submittedTimeInSeconds: number;
  proofUrl?: string;
  notes?: string;
  submittedAt: string;
  status: VirtualResultSubmissionStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}
