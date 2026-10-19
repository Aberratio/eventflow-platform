import { useQuery } from '@tanstack/react-query';
import { listCompetitorDuplicateReports } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompetitorDuplicateReportProfile } from '@/types';

const name = (p: CompetitorDuplicateReportProfile) =>
  `${p.firstName} ${p.lastName}${p.birthDate ? ` (${p.birthDate})` : ''}`;

/**
 * R-08: otwarte zgłoszenia duplikatów od opiekunów/organizatorów, nad narzędziem
 * scalania. "Porównaj" ładuje oba profile do porównania; samo zgłoszenie niczego nie scala.
 */
export const DuplicateReportsQueue = ({
  onCompare,
}: {
  onCompare: (a: string, b: string) => void;
}) => {
  const { data } = useQuery({
    queryKey: QUERY_KEYS.competitorDuplicateReports,
    queryFn: () => listCompetitorDuplicateReports(),
  });
  const reports = data?.data ?? [];
  if (reports.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Zgłoszone duplikaty ({reports.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {reports.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2">
              <div className="text-sm">
                <p className="font-medium">
                  {name(r.competitor)} ↔ {name(r.duplicateOf)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Zgłosił(a): {r.reporterName ?? 'nieznany'} ({r.reporterRole})
                  {r.note ? ` — ${r.note}` : ''}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCompare(r.competitorId, r.duplicateOfId)}
              >
                Porównaj
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
