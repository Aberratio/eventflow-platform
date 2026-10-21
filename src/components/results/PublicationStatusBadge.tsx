import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock } from 'lucide-react';

interface PublicationStatusBadgeProps {
  status: 'preliminary' | 'official';
  className?: string;
}

/**
 * Publication indicator of the results: "Wstępne" (preliminary) / "Oficjalne" (official).
 * The granularity is Wydarzenie+Dystans (a classification) - all rows of the same
 * classification share one status, so this badge represents the whole
 * classification, not a single result.
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
