import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface QueryErrorStateProps {
  /** Usually the query's `refetch`. */
  onRetry: () => void;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Shown when loading data FAILED (5xx, network, timeout) - distinct from the "not found" /
 * empty states, which mean the request succeeded and there is nothing to show.
 */
export const QueryErrorState = ({
  onRetry,
  title = 'Nie udało się pobrać danych',
  description = 'Wystąpił problem z połączeniem lub serwerem. Spróbuj ponownie za chwilę.',
  className,
}: QueryErrorStateProps) => (
  <div
    role="alert"
    className={cn(
      'rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center',
      className,
    )}
  >
    <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
    <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    <Button variant="outline" className="mt-5" onClick={onRetry}>
      Spróbuj ponownie
    </Button>
  </div>
);
