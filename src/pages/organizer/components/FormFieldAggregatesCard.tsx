import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFormFieldAggregates } from '@/api';

interface FormFieldAggregatesCardProps {
  eventId: string;
}

/**
 * The organizer's "minimum" summary — an automatic count
 * of answers for every choice-type form field (single_choice/
 * multi_choice/consent), fed by GET /events/{id}/form-field-aggregates.
 * No configuration on the client side — the server decides which fields
 * qualify purely from their type (FormFieldRepository::aggregatesForEvent()),
 * so this component only renders whatever it gets back.
 */
export const FormFieldAggregatesCard = ({ eventId }: FormFieldAggregatesCardProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['form-field-aggregates', eventId],
    queryFn: () => getFormFieldAggregates(eventId),
    select: (r) => r.data ?? [],
  });

  const aggregates = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Zestawienia formularza
        </CardTitle>
        <CardDescription>
          Liczba odpowiedzi na pola wyboru (np. rozmiar koszulki) wśród aktywnych zapisów
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && <p className="text-sm text-muted-foreground">Ładowanie...</p>}

        {!isLoading && aggregates.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            To wydarzenie nie ma jeszcze pól formularza typu wyboru (lista, checkbox, zgoda) do
            zestawienia.
          </p>
        )}

        {aggregates.map((aggregate) => {
          const total = aggregate.counts.reduce((sum, c) => sum + c.count, 0);
          const max = Math.max(1, ...aggregate.counts.map((c) => c.count));

          return (
            <div key={aggregate.formFieldId} className="space-y-2">
              <h3 className="text-sm font-semibold">{aggregate.label}</h3>
              <div className="space-y-1.5">
                {aggregate.counts.map((count) => (
                  <div key={count.key} className="flex items-center gap-3 text-sm">
                    <span className="w-32 shrink-0 truncate text-muted-foreground">
                      {count.label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(count.count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-medium">{count.count}</span>
                  </div>
                ))}
              </div>
              {aggregate.fieldType === 'multi_choice' && (
                <p className="text-xs text-muted-foreground">
                  Suma wyborów: {total} (jeden zapis może liczyć się w kilku opcjach)
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
