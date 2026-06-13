import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldHelp, HelpLabel } from '@/components/ui/field-help';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Plus,
  Trash2,
  ListPlus,
  Map,
  ChevronDown,
  Calendar,
  Users,
  Wallet,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type { EventFormState } from '../hooks/useEventFormState';
import { applyDiscount } from '@/api';
import type { ParticipantCountType, PriceTierMode } from '@/types';
import { PriceTierPreview } from '@/components/pricing/PriceTierPreview';

interface EventFormStep2Props {
  form: EventFormState;
}

export const EventFormStep2 = ({ form }: EventFormStep2Props) => {
  const isEmbedRegistration = form.registrationMode === 'external_embed';

  const setTierPrice = (
    distanceIndex: number,
    tierId: string,
    basePriceInput: string,
    priceInput: string,
  ) => {
    const basePrice = Number(basePriceInput) || 0;
    const tierPrice = Number(priceInput);
    form.updatePriceTier(distanceIndex, tierId, {
      price: Number.isFinite(tierPrice) ? tierPrice : 0,
      discountType: 'fixed',
      discountValue: Number.isFinite(tierPrice) ? basePrice - tierPrice : 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* EVENT-LEVEL CATEGORIES */}
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6">
          <CardTitle className="text-xl">Kategorie uczestników</CardTitle>
          <p className="text-sm text-muted-foreground">
            Zdefiniuj kategorie dla całego wydarzenia. W poszczególnych dystansach możesz wyłączyć
            wybrane kategorie.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 p-4 pt-0 sm:p-6 sm:pt-0">
          {/* Age Categories */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-1.5">
                <Label className="text-base font-medium">
                  Kategorie wiekowe ({form.ageCategories.length})
                </Label>
                <FieldHelp description="Kategorie wiekowe grupuja uczestnikow wedlug rocznika i plci. Sa pozniej uzywane w zapisach, listach startowych i wynikach." />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={form.applyStandardTemplate}
                className="w-full sm:w-auto"
              >
                <ListPlus className="mr-2 h-4 w-4" /> Załaduj szablon standardowy
              </Button>
            </div>

            {form.ageCategories.length > 0 && (
              <div className="space-y-2">
                <div className="hidden gap-2 px-1 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1fr_80px_100px_100px_40px]">
                  <span className="flex items-center gap-1">
                    Nazwa
                    <FieldHelp description="Nazwa kategorii widoczna w zapisach i wynikach, np. K18-29 albo M40-49." />
                  </span>
                  <span className="flex items-center gap-1">
                    Płeć
                    <FieldHelp description="Okresla, czy dana kategoria dotyczy kobiet czy mezczyzn." />
                  </span>
                  <span className="flex items-center gap-1">
                    Rok od
                    <FieldHelp description="Najmlodszy rocznik kwalifikujacy sie do tej kategorii." />
                  </span>
                  <span className="flex items-center gap-1">
                    Rok do
                    <FieldHelp description="Najstarszy rocznik kwalifikujacy sie do tej kategorii." />
                  </span>
                  <span></span>
                </div>
                {form.ageCategories.map((cat, catIdx) => (
                  <div
                    key={cat.id}
                    className="grid grid-cols-[minmax(0,1fr)_88px] items-center gap-2 md:grid-cols-[1fr_80px_100px_100px_40px]"
                  >
                    <Input
                      value={cat.name}
                      onChange={(e) => form.updateAgeCategory(catIdx, 'name', e.target.value)}
                      placeholder="np. K18-29"
                      className="h-9"
                    />
                    <Select
                      value={cat.gender}
                      onValueChange={(v: 'K' | 'M') => form.updateAgeCategory(catIdx, 'gender', v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="K">K</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={cat.birthYearFrom}
                      onChange={(e) =>
                        form.updateAgeCategory(
                          catIdx,
                          'birthYearFrom',
                          parseInt(e.target.value) || 0,
                        )
                      }
                      placeholder="1990"
                      className="h-9"
                    />
                    <Input
                      type="number"
                      value={cat.birthYearTo}
                      onChange={(e) =>
                        form.updateAgeCategory(catIdx, 'birthYearTo', parseInt(e.target.value) || 0)
                      }
                      placeholder="2000"
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-full text-destructive hover:text-destructive md:w-9"
                      onClick={() => form.removeAgeCategory(catIdx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={form.addAgeCategory}
              className="w-full text-primary sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" /> Dodaj kategorię wiekową
            </Button>
          </div>

          {/* Special Categories */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-1.5">
              <Label className="text-base font-medium">
                Kategorie specjalne ({form.specialCategories.length})
              </Label>
              <FieldHelp description="Kategorie specjalne dodaja dodatkowe klasyfikacje niezalezne od wieku, np. mieszkancy miasta, sluzby mundurowe albo pracownicy firmy." />
            </div>
            {form.specialCategories.length > 0 && (
              <div className="space-y-2">
                <div className="hidden gap-2 px-1 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1fr_1fr_40px]">
                  <span className="flex items-center gap-1">
                    Nazwa
                    <FieldHelp description="Nazwa kategorii specjalnej widoczna dla uczestnikow i w klasyfikacjach." />
                  </span>
                  <span className="flex items-center gap-1">
                    Opis (opcjonalnie)
                    <FieldHelp description="Krotkie wyjasnienie warunkow przynaleznosci do kategorii specjalnej." />
                  </span>
                  <span></span>
                </div>
                {form.specialCategories.map((cat, catIdx) => (
                  <div
                    key={cat.id}
                    className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto] md:grid-cols-[1fr_1fr_40px]"
                  >
                    <Input
                      value={cat.name}
                      onChange={(e) => form.updateSpecialCategory(catIdx, 'name', e.target.value)}
                      placeholder="np. Mieszkaniec Warszawy"
                      className="h-9 sm:col-span-2 md:col-span-1"
                    />
                    <Input
                      value={cat.description || ''}
                      onChange={(e) =>
                        form.updateSpecialCategory(catIdx, 'description', e.target.value)
                      }
                      placeholder="np. Osoby zameldowane w Warszawie"
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-full text-destructive hover:text-destructive sm:w-9"
                      onClick={() => form.removeSpecialCategory(catIdx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={form.addSpecialCategory}
              className="w-full text-primary sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" /> Dodaj kategorię specjalną
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DISTANCES */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Dystanse ({form.distances.length})</h2>
        <Button onClick={form.addDistance} variant="outline" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Dodaj dystans
        </Button>
      </div>

      {form.distances.length === 0 && (
        <Card>
          <CardContent className="p-6 py-10 text-center text-muted-foreground sm:py-12">
            <p>Nie dodano jeszcze żadnych dystansów.</p>
            <Button onClick={form.addDistance} className="mt-4 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Dodaj pierwszy dystans
            </Button>
          </CardContent>
        </Card>
      )}

      {form.distances.map((dist, index) => (
        <Card key={dist.id}>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="min-w-0 break-words text-lg">
                {dist.name || `Dystans ${index + 1}`}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => form.removeDistance(index)}
                className="shrink-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <HelpLabel description="Nazwa wariantu startu widoczna przy zapisach, wynikach i na stronie wydarzenia, np. 5 km, Maraton albo Sprint.">
                  Nazwa dystansu *
                </HelpLabel>
                <Input
                  value={dist.name}
                  onChange={(e) => form.updateDistance(index, 'name', e.target.value)}
                  placeholder="np. Maraton"
                />
              </div>
              <div className="space-y-2">
                <HelpLabel description="Dlugosc dystansu wraz z jednostka. Dane sa pokazywane uczestnikom i pomagaja odroznic warianty zapisow.">
                  Długość *
                </HelpLabel>
                <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-2">
                  <Input
                    type="number"
                    value={dist.length}
                    onChange={(e) => form.updateDistance(index, 'length', e.target.value)}
                    placeholder="42.195"
                  />
                  <Select
                    value={dist.unit}
                    onValueChange={(v: 'km' | 'm') => form.updateDistance(index, 'unit', v)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="km">km</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <HelpLabel description="Podstawowa oplata startowa za ten dystans w zlotowkach. Uzywana w koszyku, rejestracji i podsumowaniach platnosci.">
                  Cena bazowa (PLN) *
                </HelpLabel>
                <Input
                  type="number"
                  value={dist.price}
                  onChange={(e) => form.updateDistance(index, 'price', e.target.value)}
                  placeholder="150"
                />
              </div>
              <div className="space-y-2">
                <HelpLabel description="Cena pobierana przy zapisie na miejscu, w biurze zawodow. Nie zmienia ceny online, ale jest widoczna w podgladzie wydarzenia.">
                  Cena w biurze
                </HelpLabel>
                <Input
                  type="number"
                  value={dist.officePrice}
                  onChange={(e) => form.updateDistance(index, 'officePrice', e.target.value)}
                  placeholder="180"
                />
              </div>
              <div className="space-y-2">
                <HelpLabel description="Maksymalna liczba zapisow na dany dystans. Puste pole oznacza brak konkretnego limitu w formularzu.">
                  Limit uczestników
                </HelpLabel>
                <Input
                  type="number"
                  value={dist.limit}
                  onChange={(e) => form.updateDistance(index, 'limit', e.target.value)}
                  placeholder="500"
                />
              </div>
            </div>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full justify-start gap-2 rounded-none border-t pt-4 text-muted-foreground"
                >
                  <Wallet className="h-4 w-4" /> Konfiguracja płatności
                  {isEmbedRegistration ? (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      po stronie organizatora
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {dist.priceTiers.length} progów
                    </Badge>
                  )}
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {isEmbedRegistration ? (
                  <Alert className="border-muted bg-muted/50">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Platnosci i progi poza systemem</AlertTitle>
                    <AlertDescription>
                      Dla zawodow typu embed nie konfigurujemy progow cenowych ani sposobu
                      pobierania oplat. Te zasady ustala i obsluguje organizator lub zewnetrzny
                      system poza panelem.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                      <div className="space-y-2">
                        <HelpLabel
                          className="text-xs"
                          description="Okresla, czy aktywny prog zalezy od daty, czy od liczby zapisanych lub oplaconych uczestnikow."
                        >
                          Sposob naliczania
                        </HelpLabel>
                        <Select
                          value={dist.priceTierMode}
                          onValueChange={(value: PriceTierMode) => {
                            form.updateDistance(index, 'priceTierMode', value);
                            form.updateDistance(index, 'priceTiers', []);
                          }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">
                              <span className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" /> Po dacie
                              </span>
                            </SelectItem>
                            <SelectItem value="participants">
                              <span className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5" /> Po liczbie uczestnikow
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {dist.priceTierMode === 'participants' && (
                        <div className="space-y-2">
                          <HelpLabel
                            className="text-xs"
                            description="Dla progow uczestnikow mozesz liczyc wszystkie zapisy albo tylko osoby z potwierdzona oplata startowa."
                          >
                            Licznik uczestnikow
                          </HelpLabel>
                          <Select
                            value={dist.participantCountType}
                            onValueChange={(value: ParticipantCountType) =>
                              form.updateDistance(index, 'participantCountType', value)
                            }
                          >
                            <SelectTrigger className="h-9 max-w-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="registered">Zapisani</SelectItem>
                              <SelectItem value="paid">Oplaceni</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <PriceTierPreview
                      basePrice={Number(dist.price) || 0}
                      tiers={dist.priceTiers}
                      mode={dist.priceTierMode}
                      participantCountType={dist.participantCountType}
                    />

                    {dist.priceTiers.length > 0 && (
                      <div className="space-y-2">
                        <div className="hidden gap-2 px-1 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1fr_150px_130px_1fr_40px]">
                          <span>Nazwa</span>
                          <span>{dist.priceTierMode === 'date' ? 'Obowiazuje do' : 'Limit'}</span>
                          <span>Cena w progu</span>
                          <span>Opis</span>
                          <span></span>
                        </div>
                        {[...dist.priceTiers]
                          .sort((a, b) =>
                            dist.priceTierMode === 'date'
                              ? String(a.endDate || '').localeCompare(String(b.endDate || ''))
                              : Number(a.participantLimit || 0) - Number(b.participantLimit || 0),
                          )
                          .map((tier) => {
                            const tierPrice =
                              tier.price ??
                              applyDiscount(
                                Number(dist.price) || 0,
                                tier.discountType,
                                tier.discountValue,
                              );
                            const basePrice = Number(dist.price) || 0;
                            const priceWarning = tierPrice > basePrice;
                            return (
                              <div
                                key={tier.id}
                                className="grid grid-cols-1 items-center gap-2 rounded-md border p-3 md:grid-cols-[1fr_150px_130px_1fr_40px]"
                              >
                                <Input
                                  value={tier.name}
                                  onChange={(e) =>
                                    form.updatePriceTier(index, tier.id, { name: e.target.value })
                                  }
                                  placeholder="np. Early Bird"
                                  className="h-9"
                                />
                                <Input
                                  type={dist.priceTierMode === 'date' ? 'date' : 'number'}
                                  value={
                                    dist.priceTierMode === 'date'
                                      ? tier.endDate || ''
                                      : tier.participantLimit || ''
                                  }
                                  onChange={(e) =>
                                    form.updatePriceTier(
                                      index,
                                      tier.id,
                                      dist.priceTierMode === 'date'
                                        ? { endDate: e.target.value }
                                        : { participantLimit: parseInt(e.target.value) || 0 },
                                    )
                                  }
                                  placeholder={
                                    dist.priceTierMode === 'date' ? undefined : 'np. 100'
                                  }
                                  className="h-9"
                                />
                                <Input
                                  type="number"
                                  value={tierPrice}
                                  onChange={(e) =>
                                    setTierPrice(index, tier.id, dist.price, e.target.value)
                                  }
                                  placeholder="np. 120"
                                  className="h-9"
                                />
                                {priceWarning && (
                                  <p className="flex items-start gap-1.5 text-xs text-amber-700 md:col-start-3">
                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>
                                      Cena progu jest wyzsza od ceny bazowej. To tylko ostrzezenie.
                                    </span>
                                  </p>
                                )}
                                <Input
                                  value={tier.description || ''}
                                  onChange={(e) =>
                                    form.updatePriceTier(index, tier.id, {
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder={
                                    dist.priceTierMode === 'date'
                                      ? 'np. cena do konca maja'
                                      : 'np. pierwsze 100 oplaconych'
                                  }
                                  className="h-9"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-full text-destructive hover:text-destructive md:w-9"
                                  onClick={() => form.removePriceTier(index, tier.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.addPriceTier(index)}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Dodaj prog cenowy
                    </Button>
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Per-distance category toggles */}
            {form.allCategories.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm text-muted-foreground">
                    Kategorie w tym dystansie (odznacz, aby wyłączyć)
                  </Label>
                  <FieldHelp description="Pozwala wlaczyc lub wylaczyc wybrane kategorie dla konkretnego dystansu, gdy nie wszystkie klasyfikacje maja zastosowanie." />
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.allCategories.map((cat) => {
                    const isDisabled = dist.disabledCategoryIds.includes(cat.id);
                    return (
                      <Badge
                        key={cat.id}
                        variant={isDisabled ? 'outline' : 'secondary'}
                        className={`cursor-pointer select-none transition-opacity ${isDisabled ? 'line-through opacity-40' : ''}`}
                        onClick={() => form.toggleCategoryForDistance(index, cat.id)}
                      >
                        {cat.name}
                        {cat.type === 'special' ? ' ★' : ''}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Route artifacts */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full justify-start gap-2 rounded-none border-t pt-4 text-muted-foreground"
                >
                  <Map className="h-4 w-4" /> Trasa i mapy
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <HelpLabel
                      className="text-xs"
                      description="Link do mapy trasy, ktora uczestnik moze otworzyc przed startem."
                    >
                      URL mapy trasy
                    </HelpLabel>
                    <Input
                      value={dist.routeMapUrl}
                      onChange={(e) => form.updateDistance(index, 'routeMapUrl', e.target.value)}
                      placeholder="https://..."
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <HelpLabel
                      className="text-xs"
                      description="Link do profilu przewyzszen, przydatny szczegolnie dla biegow gorskich, kolarskich i tras trailowych."
                    >
                      URL profilu przewyższeń
                    </HelpLabel>
                    <Input
                      value={dist.routeElevationProfile}
                      onChange={(e) =>
                        form.updateDistance(index, 'routeElevationProfile', e.target.value)
                      }
                      placeholder="https://..."
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <HelpLabel
                      className="text-xs"
                      description="Link do pliku GPX, ktory uczestnik moze pobrac do zegarka, nawigacji lub aplikacji treningowej."
                    >
                      URL pliku GPX
                    </HelpLabel>
                    <Input
                      value={dist.routeGpxUrl}
                      onChange={(e) => form.updateDistance(index, 'routeGpxUrl', e.target.value)}
                      placeholder="https://..."
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium">Dodatkowe pliki</Label>
                    <FieldHelp description="Lista dodatkowych materialow dla trasy, np. mapa, profil przewyzszen, GPX albo zdjecie trasy." />
                  </div>
                  {dist.routeFiles.map((file) => (
                    <div
                      key={file.id}
                      className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_1fr_100px_32px]"
                    >
                      <Input
                        value={file.name}
                        onChange={(e) =>
                          form.updateRouteFile(index, file.id, 'name', e.target.value)
                        }
                        placeholder="Nazwa pliku"
                        className="h-9 min-w-0"
                      />
                      <Input
                        value={file.url}
                        onChange={(e) =>
                          form.updateRouteFile(index, file.id, 'url', e.target.value)
                        }
                        placeholder="URL"
                        className="h-9 min-w-0"
                      />
                      <Select
                        value={file.type}
                        onValueChange={(v) => form.updateRouteFile(index, file.id, 'type', v)}
                      >
                        <SelectTrigger className="h-9 sm:w-[120px] lg:w-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="map">Mapa</SelectItem>
                          <SelectItem value="elevation">Profil</SelectItem>
                          <SelectItem value="gpx">GPX</SelectItem>
                          <SelectItem value="image">Zdjęcie</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-full text-destructive hover:text-destructive sm:w-9"
                        onClick={() => form.removeRouteFile(index, file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => form.addRouteFile(index)}
                    className="w-full text-primary sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Dodaj plik
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
