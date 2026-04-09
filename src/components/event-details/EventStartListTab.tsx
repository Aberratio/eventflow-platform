import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Registration } from '@/types';
import { Link } from 'react-router-dom';

interface EventStartListTabProps {
  registrations: Registration[];
}

export const EventStartListTab = ({ registrations }: EventStartListTabProps) => {
  const confirmedRegistrations = registrations.filter((r) => r.status === 'confirmed');

  return (
    <Card>
      <CardContent className="pt-6">
        {confirmedRegistrations.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr</TableHead>
                  <TableHead>Uczestnik</TableHead>
                  <TableHead>Dystans</TableHead>
                  <TableHead>Kategoria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmedRegistrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-mono">{reg.bibNumber || '-'}</TableCell>
                    <TableCell>
                      <Link
                        to={`/athlete/${reg.userId}`}
                        className="font-medium transition-colors hover:text-primary hover:underline"
                      >
                        {reg.userName}
                      </Link>
                    </TableCell>
                    <TableCell>{reg.distanceName}</TableCell>
                    <TableCell>{reg.category}</TableCell>
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
