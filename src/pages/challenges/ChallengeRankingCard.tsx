import { getChallengeRanking } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Medal } from 'lucide-react';

/**
 * Public, read-only ranking for one Wyzwanie — descending points, ex-aequo
 * ties sharing a rank, anonymized competitors already masked by the server
 * (ChallengeRankingCalculator/CompetitorNamePresenter) — this component never
 * sees a real name for an anonymized competitor, so there is nothing to hide
 * client-side.
 *
 * A semantic `<table>` (the shared `Table` primitives, already used
 * elsewhere in this codebase) rather than a div-grid: rank/name/points read
 * correctly with a screen reader via real `<th>`/`<td>` cells, and the
 * `Table` wrapper already scrolls horizontally on narrow viewports instead
 * of overflowing the page (WCAG 2.1 AA — no horizontal page scroll).
 */
export const ChallengeRankingCard = ({ challengeId }: { challengeId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.challengeRanking(challengeId),
    queryFn: () => getChallengeRanking(challengeId),
    enabled: !!challengeId,
  });
  const ranking = data?.data;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Medal className="h-5 w-5 text-amber-500" aria-hidden="true" />
          Ranking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Ładowanie rankingu...</p>
        ) : !ranking || ranking.entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nikt jeszcze nie dołączył do tego Wyzwania.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption className="sr-only">
                Ranking publiczny uczestników Wyzwania, posortowany malejąco wg punktów.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="w-16">
                    Miejsce
                  </TableHead>
                  <TableHead scope="col">Zawodnik</TableHead>
                  <TableHead scope="col" className="text-right">
                    {ranking.hasPoints ? 'Punkty' : 'Status'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.entries.map((entry) => (
                  <TableRow key={entry.competitorId ?? entry.userId}>
                    <TableCell className="font-medium">{entry.rank}</TableCell>
                    <TableCell>
                      <span>{entry.name}</span>
                      {entry.isAnonymized && (
                        <Badge variant="outline" className="ml-2 align-middle text-xs">
                          Anonimowy
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {ranking.hasPoints
                        ? entry.points
                        : entry.isCompleted
                          ? 'Ukończono'
                          : 'W trakcie'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChallengeRankingCard;
