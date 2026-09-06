import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock } from 'lucide-react';

interface PublicationStatusBadgeProps {
  status: 'preliminary' | 'official';
  className?: string;
}

/**
 * "Wstepne" / "oficjalne" wskaznik publikacji wynikow (spec 14 Answer §6, E2.3).
 * Granulacja to Wydarzenie+Dystans (klasyfikacja) - wszystkie wiersze tej samej
 * klasyfikacji dziela ten sam status, wiec ten badge reprezentuje cala
 * klasyfikacje, nie pojedynczy wynik.
 */
export const PublicationStatusBadge = ({ status, className }: PublicationStatusBadgeProps) => {
  if (status === 'official') {
    return (
      <Badge className={`gap-1 bg-success/10 text-success ${className ?? ''}`}>
        <CheckCircle2 className="h-3 w-3" />
        Oficjalne
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`gap-1 ${className ?? ''}`}>
      <Clock className="h-3 w-3" />
      Wstępne
    </Badge>
  );
};
