import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTeamMembers } from '@/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TeamMember } from '@/types';
import SwapTeamMemberDialog from './SwapTeamMemberDialog';

interface TeamRosterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
}

/**
 * G-04: the captain's view of the roster with a "Wymień zawodnika" action per member (the swap
 * deadline is enforced by the server; a late swap is answered with a clear message).
 */
const TeamRosterDialog = ({ open, onOpenChange, teamId, teamName }: TeamRosterDialogProps) => {
  const [swapping, setSwapping] = useState<TeamMember | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => getTeamMembers(teamId),
    enabled: open,
    retry: false,
  });
  const members = data?.data ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skład drużyny {teamName}</DialogTitle>
            <DialogDescription>
              Wymień zawodnika, który nie może wystartować. Opłata i numer startowy zostają przy
              zapisie.
            </DialogDescription>
          </DialogHeader>

          {isLoading && <p className="text-sm text-muted-foreground">Ładowanie składu…</p>}
          {isError && (
            <p className="text-sm text-destructive">Nie udało się wczytać składu drużyny.</p>
          )}
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.registrationId}
                className="flex items-center justify-between gap-2 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{member.name}</p>
                  {member.bibNumber && (
                    <p className="text-sm text-muted-foreground">Nr startowy {member.bibNumber}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSwapping(member)}
                >
                  Wymień zawodnika
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {swapping && (
        <SwapTeamMemberDialog
          open
          onOpenChange={(next) => {
            if (!next) setSwapping(null);
          }}
          teamId={teamId}
          registrationId={swapping.registrationId}
          memberName={swapping.name}
          offerCareCompetitors
        />
      )}
    </>
  );
};

export default TeamRosterDialog;
