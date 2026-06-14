import { disciplineLabels } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FieldHelp } from '@/components/ui/field-help';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import { Eye, Globe, CreditCard, Building2 } from 'lucide-react';
import type { EventFormState } from '../hooks/useEventFormState';

interface EventFormStep3Props {
  form: EventFormState;
}

export const EventFormStep3 = ({ form }: EventFormStep3Props) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Eye className="h-5 w-5 shrink-0" /> Podgląd wydarzenia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Nazwa</p>
              <p className="break-words font-medium">{form.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dyscyplina</p>
              <p className="font-medium">{form.disciplines.map((d) => disciplineLabels[d]).join(', ')}</p>
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
              <p className="break-all font-medium text-primary">
                /events/{form.generateSlug(form.name)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Metoda płatności</p>
              <p className="flex flex-wrap items-center gap-2 font-medium">
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
              <RichTextDisplay html={form.description} className="break-words font-medium" />
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
            {form.canManageFeatured && form.featured && (
              <Badge variant="default">⭐ Wyróżnione wydarzenie</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6">
          <CardTitle className="flex flex-wrap items-center gap-1.5 text-lg sm:text-xl">
            Status po zapisie
            <FieldHelp description="Organizator tworzy szkic. Publikacja jest dostepna dopiero po sprawdzeniu i zatwierdzeniu przez admina lub moderatora." />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <Badge variant="secondary">Szkic</Badge>
          <p className="text-sm text-muted-foreground">
            Wydarzenie będzie widoczne tylko w panelu organizatora. Po zapisaniu możesz oddać je do
            sprawdzenia w ustawieniach wydarzenia.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
