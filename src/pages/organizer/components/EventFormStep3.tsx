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
            <Eye className="h-5 w-5" /> PodglÄ…d wydarzenia
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
              <p className="text-sm text-muted-foreground">Metoda pĹ‚atnoĹ›ci</p>
              <p className="flex items-center gap-2 font-medium">
                {form.paymentConfigType === 'admin_gateway' ? (
                  <>
                    <CreditCard className="h-4 w-4 text-primary" /> Bramka pĹ‚atnicza (automatyczna)
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 text-primary" /> Przelew bankowy (rÄ™czny)
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
                  {cat.type === 'special' ? ' â…' : ''}
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
            {form.featured && <Badge variant="default">â­ WyrĂłĹĽnione wydarzenie</Badge>}
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
              variant={form.status === 'active' ? 'default' : 'outline'}
              onClick={() => form.setStatus('active')}
              className="flex-1"
            >
              Ustaw jako aktywne
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {form.status === 'draft'
              ? 'Wydarzenie będzie widoczne tylko w panelu organizatora. Możesz ustawić je jako aktywne później.'
              : 'Wydarzenie zostanie zapisane jako aktywne i będzie widoczne publicznie.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

