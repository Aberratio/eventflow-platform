/**
 * The Event Team - the Owner plus Co-managers.
 * The Owner is `events.organizer_id`; the server stores only the Co-managers.
 */
export type EventTeamRole = 'owner' | 'co_manager';

export type EventTeamMemberStatus = 'invited' | 'active' | 'revoked';

export interface EventTeamOwner {
  id: string;
  name: string;
  email: string;
}

export interface EventTeamMember {
  id: string;
  eventId: string;
  /** Null until an invited address has an Account that accepted. */
  userId: string | null;
  role: 'co_manager';
  status: EventTeamMemberStatus;
  email: string;
  name: string | null;
  inviteExpiresAt: string | null;
  invitedBy: string | null;
  createdAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
}

export interface EventTeam {
  owner: EventTeamOwner | null;
  members: EventTeamMember[];
}

/** `mailState` is how the invitation e-mail went: sent / pending (retry scheduled) / lost. */
export type EventTeamInvitationMailState = 'sent' | 'pending' | 'lost';

export type EventTeamMemberWithMail = EventTeamMember & {
  mailState?: EventTeamInvitationMailState;
};

/** `GET /team-invitations/{token}` - public, the address is masked. */
export interface TeamInvitationPreview {
  eventName: string;
  inviterName: string;
  email: string;
  status: EventTeamMemberStatus;
  expiresAt: string | null;
}

/** `POST /team-invitations/{token}/accept`. */
export interface TeamInvitationAcceptance {
  eventId: string;
  eventName: string;
  teamRole: 'co_manager';
  status: EventTeamMemberStatus;
}
