import { disciplineLabels } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Globe, CreditCard, Building2 } from 'lucide-react';
import type { EventFormState } from '../hooks/useEventFormState';

interface EventFormStep3Props {
  form: EventFormState;
}

export const EventFormStep3 = ({ form }: EventFormStep3Props) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" /> Podgląd wydarzenia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Nazwa</p>
              <p className="font-medium">{form.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dyscyplina</p>
              <p className="font-medium">{disciplineLabels[form.discipline]}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-medium">{form.date}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Termin rejestracji</p>
              <p className="font-medium">{form.registrationDeadline}</p>
            </div>
            {form.isVirtual ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Okno startowe</p>
                  <p className="font-medium">
                    {form.startDate} - {form.endDate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Typ wydarzenia</p>
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                    <Globe className="mr-1 h-3 w-3" /> Wirtualny
                  </Badge>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">Lokalizacja</p>
                <p className="font-medium">
                  {form.location}, {form.city}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Slug URL</p>
              <p className="font-medium text-primary">/events/{form.generateSlug(form.name)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Metoda płatności</p>
              <p className="flex items-center gap-2 font-medium">
                {form.paymentConfigType === 'admin_gateway' ? (
                  <>
                    <CreditCard className="h-4 w-4 text-primary" /> Bramka płatnicza (automatyczna)
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 text-primary" /> Przelew bankowy (ręczny)
                  </>
                )}
              </p>
            </div>
          </div>

          {form.description && (
            <div>
              <p className="text-sm text-muted-foreground">Opis</p>
              <p className="font-medium">{form.description}</p>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              Kategorie ({form.allCategories.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {form.allCategories.map((cat) => (
                <Badge key={cat.id} variant={cat.type === 'special' ? 'outline' : 'secondary'}>
                  {cat.name}
                  {cat.type === 'special' ? ' ★' : ''}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">Dystanse ({form.distances.length})</p>
            <div className="flex flex-wrap gap-2">
              {form.distances.map((dist) => (
                <Badge key={dist.id} variant="secondary">
                  {dist.name} - {dist.length} {dist.unit} ({dist.price} PLN)
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {form.isVirtual && (
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                <Globe className="mr-1 h-3 w-3" /> Wirtualny
              </Badge>
            )}
            {form.featured && <Badge variant="default">⭐ Wyróżnione wydarzenie</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status publikacji</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant={form.status === 'draft' ? 'default' : 'outline'}
              onClick={() => form.setStatus('draft')}
              className="flex-1"
            >
              Zapisz jako szkic
            </Button>
            <Button
              variant={form.status === 'awaiting_approval' ? 'default' : 'outline'}
              onClick={() => form.setStatus('awaiting_approval')}
              className="flex-1"
            >
              Zgłoś do akceptacji
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {form.status === 'draft'
              ? 'Wydarzenie będzie widoczne tylko dla Ciebie. Możesz je zgłosić do akceptacji później.'
              : 'Wydarzenie zostanie przesłane do administratora w celu weryfikacji i zatwierdzenia.'}
          </p>
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <strong>Uwaga:</strong> Wszystkie nowe wydarzenia wymagają zatwierdzenia przez
            administratora przed publikacją.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
