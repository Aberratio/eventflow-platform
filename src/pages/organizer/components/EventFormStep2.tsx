import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ListPlus, Map, ChevronDown } from 'lucide-react';
import type { EventFormState } from '../hooks/useEventFormState';

interface EventFormStep2Props {
  form: EventFormState;
}

export const EventFormStep2 = ({ form }: EventFormStep2Props) => {
  return (
    <div className="space-y-6">
      {/* EVENT-LEVEL CATEGORIES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Kategorie uczestników</CardTitle>
          <p className="text-sm text-muted-foreground">
            Zdefiniuj kategorie dla całego wydarzenia. W poszczególnych dystansach możesz wyłączyć wybrane kategorie.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Age Categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Kategorie wiekowe ({form.ageCategories.length})</Label>
              <Button type="button" variant="outline" size="sm" onClick={form.applyStandardTemplate}>
                <ListPlus className="mr-2 h-4 w-4" /> Załaduj szablon standardowy
              </Button>
            </div>

            {form.ageCategories.length > 0 && (
              <div className="space-y-2">
                <div className="hidden md:grid md:grid-cols-[1fr_80px_100px_100px_40px] gap-2 text-xs text-muted-foreground font-medium px-1">
                  <span>Nazwa</span><span>Płeć</span><span>Rok od</span><span>Rok do</span><span></span>
                </div>
                {form.ageCategories.map((cat, catIdx) => (
                  <div key={cat.id} className="grid grid-cols-2 md:grid-cols-[1fr_80px_100px_100px_40px] gap-2 items-center">
                    <Input value={cat.name} onChange={e => form.updateAgeCategory(catIdx, 'name', e.target.value)} placeholder="np. K18-29" className="h-9" />
                    <Select value={cat.gender} onValueChange={(v: 'K' | 'M') => form.updateAgeCategory(catIdx, 'gender', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="K">K</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" value={cat.birthYearFrom} onChange={e => form.updateAgeCategory(catIdx, 'birthYearFrom', parseInt(e.target.value) || 0)} placeholder="1990" className="h-9" />
                    <Input type="number" value={cat.birthYearTo} onChange={e => form.updateAgeCategory(catIdx, 'birthYearTo', parseInt(e.target.value) || 0)} placeholder="2000" className="h-9" />
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => form.removeAgeCategory(catIdx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={form.addAgeCategory} className="text-primary">
              <Plus className="mr-2 h-4 w-4" /> Dodaj kategorię wiekową
            </Button>
          </div>

          {/* Special Categories */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-base font-medium">Kategorie specjalne ({form.specialCategories.length})</Label>
            {form.specialCategories.length > 0 && (
              <div className="space-y-2">
                <div className="hidden md:grid md:grid-cols-[1fr_1fr_40px] gap-2 text-xs text-muted-foreground font-medium px-1">
                  <span>Nazwa</span><span>Opis (opcjonalnie)</span><span></span>
                </div>
                {form.specialCategories.map((cat, catIdx) => (
                  <div key={cat.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_40px] gap-2 items-center">
                    <Input value={cat.name} onChange={e => form.updateSpecialCategory(catIdx, 'name', e.target.value)} placeholder="np. Mieszkaniec Warszawy" className="h-9" />
                    <Input value={cat.description || ''} onChange={e => form.updateSpecialCategory(catIdx, 'description', e.target.value)} placeholder="np. Osoby zameldowane w Warszawie" className="h-9" />
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => form.removeSpecialCategory(catIdx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={form.addSpecialCategory} className="text-primary">
              <Plus className="mr-2 h-4 w-4" /> Dodaj kategorię specjalną
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DISTANCES */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dystanse ({form.distances.length})</h2>
        <Button onClick={form.addDistance} variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Dodaj dystans
        </Button>
      </div>

      {form.distances.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nie dodano jeszcze żadnych dystansów.</p>
            <Button onClick={form.addDistance} className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Dodaj pierwszy dystans
            </Button>
          </CardContent>
        </Card>
      )}

      {form.distances.map((dist, index) => (
        <Card key={dist.id}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{dist.name || `Dystans ${index + 1}`}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => form.removeDistance(index)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Nazwa dystansu *</Label>
                <Input value={dist.name} onChange={e => form.updateDistance(index, 'name', e.target.value)} placeholder="np. Maraton" />
              </div>
              <div className="space-y-2">
                <Label>Długość *</Label>
                <div className="flex gap-2">
                  <Input type="number" value={dist.length} onChange={e => form.updateDistance(index, 'length', e.target.value)} placeholder="42.195" />
                  <Select value={dist.unit} onValueChange={(v: 'km' | 'm') => form.updateDistance(index, 'unit', v)}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="km">km</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cena (PLN) *</Label>
                <Input type="number" value={dist.price} onChange={e => form.updateDistance(index, 'price', e.target.value)} placeholder="150" />
              </div>
              <div className="space-y-2">
                <Label>Limit uczestników</Label>
                <Input type="number" value={dist.limit} onChange={e => form.updateDistance(index, 'limit', e.target.value)} placeholder="500" />
              </div>
            </div>

            {/* Per-distance category toggles */}
            {form.allCategories.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <Label className="text-sm text-muted-foreground">Kategorie w tym dystansie (odznacz, aby wyłączyć)</Label>
                <div className="flex flex-wrap gap-2">
                  {form.allCategories.map(cat => {
                    const isDisabled = dist.disabledCategoryIds.includes(cat.id);
                    return (
                      <Badge
                        key={cat.id}
                        variant={isDisabled ? 'outline' : 'secondary'}
                        className={`cursor-pointer select-none transition-opacity ${isDisabled ? 'opacity-40 line-through' : ''}`}
                        onClick={() => form.toggleCategoryForDistance(index, cat.id)}
                      >
                        {cat.name}{cat.type === 'special' ? ' ★' : ''}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Route artifacts */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground w-full justify-start border-t pt-4 mt-2 rounded-none">
                  <Map className="h-4 w-4" /> Trasa i mapy
                  <ChevronDown className="h-4 w-4 ml-auto transition-transform [[data-state=open]_&]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">URL mapy trasy</Label>
                    <Input value={dist.routeMapUrl} onChange={e => form.updateDistance(index, 'routeMapUrl', e.target.value)} placeholder="https://..." className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">URL profilu przewyższeń</Label>
                    <Input value={dist.routeElevationProfile} onChange={e => form.updateDistance(index, 'routeElevationProfile', e.target.value)} placeholder="https://..." className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">URL pliku GPX</Label>
                    <Input value={dist.routeGpxUrl} onChange={e => form.updateDistance(index, 'routeGpxUrl', e.target.value)} placeholder="https://..." className="h-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Dodatkowe pliki</Label>
                  {dist.routeFiles.map(file => (
                    <div key={file.id} className="grid grid-cols-[1fr_1fr_100px_32px] gap-2 items-center">
                      <Input value={file.name} onChange={e => form.updateRouteFile(index, file.id, 'name', e.target.value)} placeholder="Nazwa pliku" className="h-9" />
                      <Input value={file.url} onChange={e => form.updateRouteFile(index, file.id, 'url', e.target.value)} placeholder="URL" className="h-9" />
                      <Select value={file.type} onValueChange={(v) => form.updateRouteFile(index, file.id, 'type', v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="map">Mapa</SelectItem>
                          <SelectItem value="elevation">Profil</SelectItem>
                          <SelectItem value="gpx">GPX</SelectItem>
                          <SelectItem value="image">Zdjęcie</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => form.removeRouteFile(index, file.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={() => form.addRouteFile(index)} className="text-primary">
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
