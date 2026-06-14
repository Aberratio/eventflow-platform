import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Event, Registration } from '@/types';
import { Link } from 'react-router-dom';

interface EventStartListTabProps {
  event: Event;
  registrations: Registration[];
  overrideShowAll?: boolean;
}

export const EventStartListTab = ({ event, registrations, overrideShowAll }: EventStartListTabProps) => {
  const showAll = overrideShowAll ?? event.displayOptions?.showParticipants === 'all';

  // Serwer już odfiltrował wg showParticipants — tu tylko usuwamy techniczne statusy
  const visibleRegistrations = registrations.filter(
    (r) => r.status !== 'removed' && r.status !== 'cancelled',
  );

  const uppercaseNames = event.displayOptions?.uppercaseNames ?? false;

  const sorted = [...visibleRegistrations].sort((a, b) => {
    const sortKey = event.displayOptions?.defaultSort || 'name';
    switch (sortKey) {
      case 'bib':
        return (a.bibNumber || '').localeCompare(b.bibNumber || '', undefined, { numeric: true });
      case 'date':
        return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
      case 'distance':
        return a.distanceName.localeCompare(b.distanceName);
      default:
        return a.userName.localeCompare(b.userName);
    }
  });

  return (
    <Card>
      <CardContent className="pt-6">
        {sorted.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr</TableHead>
                  <TableHead>Uczestnik</TableHead>
                  <TableHead>Dystans</TableHead>
                  <TableHead>Kategoria</TableHead>
                  {showAll && <TableHead>Status</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-mono">{reg.bibNumber || '-'}</TableCell>
                    <TableCell>
                      <Link
                        to={`/athlete/${reg.userId}`}
                        className="font-medium transition-colors hover:text-primary hover:underline"
                      >
                        {uppercaseNames ? reg.userName.toUpperCase() : reg.userName}
                      </Link>
                    </TableCell>
                    <TableCell>{reg.distanceName}</TableCell>
                    <TableCell>{reg.category}</TableCell>
                    {showAll && (
                      <TableCell>
                        {reg.status === 'confirmed' ? (
                          <Badge className="bg-primary/10 text-primary">Opłacony</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Oczekujący
                          </Badge>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            Lista startowa będzie dostępna wkrótce.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
