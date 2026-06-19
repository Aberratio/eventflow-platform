import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldHelp, HelpLabel } from '@/components/ui/field-help';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { PriceTierPreview } from '@/components/pricing/PriceTierPreview';
import { applyDiscount, uploadEventDocument } from '@/api';
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
  AlertCircle,
  Upload,
  FileText,
  Link,
  X,
} from 'lucide-react';
import { useState, useRef } from 'react';
import {
  DISTANCE_ROUTE_FILE_TYPE_LABELS,
  DISTANCE_DOCUMENT_TYPE_LABELS,
  type AgeCategory,
  type ParticipantCountType,
  type PriceTierMode,
  type DistanceRouteFileType,
  type DistanceDocumentType,
  type DistanceDocument,
} from '@/types';
import { formatDistanceName, type EventFormState, type SubStep } from '../hooks/useEventFormState';

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  ) : null;

interface RouteUrlOrUploadFieldProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  acceptFiles?: string;
}

const RouteUrlOrUploadField = ({
  label,
  description,
  value,
  onChange,
  acceptFiles = 'image/*',
}: RouteUrlOrUploadFieldProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadEventDocument(file);
      if (res.data?.url) onChange(res.data.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <HelpLabel className="text-xs" description={description}>
        {label}
      </HelpLabel>
      <div className="flex gap-1.5">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="h-9 min-w-0 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          title="Wgraj plik"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground"
            title="Wyczyść"
            onClick={() => onChange('')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Link className="h-3 w-3" /> Podgląd
        </a>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={acceptFiles}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
};

interface RouteFileUploadButtonProps {
  onUploaded: (url: string) => void;
}

const RouteFileUploadButton = ({ onUploaded }: RouteFileUploadButtonProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadEventDocument(file);
      if (res.data?.url) onUploaded(res.data.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 shrink-0 gap-1.5 text-xs"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        Wgraj
      </Button>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </>
  );
};

interface DistanceDocumentUploadButtonProps {
  onUploaded: (doc: Omit<DistanceDocument, 'id'>) => void;
}

const DistanceDocumentUploadButton = ({ onUploaded }: DistanceDocumentUploadButtonProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadEventDocument(file);
      if (res.data?.url) {
        onUploaded({
          name: file.name.replace(/\.[^.]+$/, ''),
          type: 'other',
          fileUrl: res.data.url,
          fileName: res.data.originalName || file.name,
          mimeType: res.data.mimeType || file.type,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        Wgraj dokument
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </>
  );
};

const inputError = (hasError: boolean) =>
  hasError
    ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20'
    : '';

interface EventFormStep2Props {
  form: EventFormState;
  activeSubStep?: string;
}

const DISTANCE_TEMPLATES = [
  { name: '5 km', length: '5', unit: 'km' as const },
  { name: '10 km', length: '10', unit: 'km' as const },
  { name: 'Półmaraton', length: '21.097', unit: 'km' as const },
  { name: 'Maraton', length: '42.195', unit: 'km' as const },
  { name: 'Nordic Walking 5 km', length: '5', unit: 'km' as const },
  { name: 'Bieg dzieci 200 m', length: '200', unit: 'm' as const },
  { name: 'Bieg dzieci 1 km', length: '1', unit: 'km' as const },
  { name: 'Trasa rowerowa 20 km', length: '20', unit: 'km' as const },
];

type AgeCategoryTemplate = {
  label: string;
  description: string;
  generate: (eventYear: number) => AgeCategory[];
};

const AGE_CATEGORY_TEMPLATES: AgeCategoryTemplate[] = [
  {
    label: 'Standard K+M 18–60+',
    description: 'Kobiety i mężczyźni w przedziałach 18-29, 30-39, 40-49, 50-59, 60+',
    generate: (y) => {
      const ranges = [
        { label: '18-29', from: y - 29, to: y - 18 },
        { label: '30-39', from: y - 39, to: y - 30 },
        { label: '40-49', from: y - 49, to: y - 40 },
        { label: '50-59', from: y - 59, to: y - 50 },
        { label: '60+', from: y - 100, to: y - 60 },
      ];
      const cats: AgeCategory[] = [];
      for (const g of ['K', 'M'] as const)
        for (const r of ranges)
          cats.push({
            id: `cat-${g}-${r.label}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: `${g}${r.label}`,
            gender: g,
            birthYearFrom: r.from,
            birthYearTo: r.to,
          });
      return cats;
    },
  },
  {
    label: 'Open (bez płci)',
    description: 'Jedna klasyfikacja open bez podziału na płeć: 18-29, 30-39, 40-49, 50-59, 60+',
    generate: (y) => {
      const ranges = [
        { label: '18-29', from: y - 29, to: y - 18 },
        { label: '30-39', from: y - 39, to: y - 30 },
        { label: '40-49', from: y - 49, to: y - 40 },
        { label: '50-59', from: y - 59, to: y - 50 },
        { label: '60+', from: y - 100, to: y - 60 },
      ];
      return ranges.map((r) => ({
        id: `cat-open-${r.label}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: r.label,
        gender: null,
        birthYearFrom: r.from,
        birthYearTo: r.to,
      }));
    },
  },
  {
    label: 'Junior + Senior K+M',
    description: 'Do 18, 18-29, 30-39, 40-49, 50-59, 60+ dla obu płci',
    generate: (y) => {
      const ranges = [
        { label: 'Junior', from: y - 17, to: y },
        { label: '18-29', from: y - 29, to: y - 18 },
        { label: '30-39', from: y - 39, to: y - 30 },
        { label: '40-49', from: y - 49, to: y - 40 },
        { label: '50-59', from: y - 59, to: y - 50 },
        { label: '60+', from: y - 100, to: y - 60 },
      ];
      const cats: AgeCategory[] = [];
      for (const g of ['K', 'M'] as const)
        for (const r of ranges)
          cats.push({
            id: `cat-${g}-${r.label}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: `${g} ${r.label}`,
            gender: g,
            birthYearFrom: r.from,
            birthYearTo: r.to,
          });
      return cats;
    },
  },
  {
    label: 'Tylko Open K i M',
    description: 'Dwie kategorie: Kobiety Open i Mężczyźni Open bez podziału wiekowego',
    generate: () => [
      {
        id: `cat-K-open-${Date.now()}`,
        name: 'K Open',
        gender: 'K' as const,
        birthYearFrom: undefined,
        birthYearTo: undefined,
      },
      {
        id: `cat-M-open-${Date.now()}`,
        name: 'M Open',
        gender: 'M' as const,
        birthYearFrom: undefined,
        birthYearTo: undefined,
      },
    ],
  },
];

export const EventFormStep2 = ({ form, activeSubStep = 'categories' }: EventFormStep2Props) => {
  const isEmbedRegistration = form.registrationMode === 'external_embed';
  const showValidation = form.shownValidationSubSteps.includes(activeSubStep as SubStep);
  const fe = showValidation ? form.fieldValidationErrors : {};
  const [ageInputMode, setAgeInputMode] = useState<'year' | 'age'>('year');

  const eventYear = (() => {
    const d = form.date;
    if (!d) return new Date().getFullYear();
    return parseInt(d.substring(0, 4)) || new Date().getFullYear();
  })();

  const ageToYear = (age: number) => eventYear - age;
  const yearToAge = (year: number) => eventYear - year;

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
      {activeSubStep === 'categories' && (
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-xl">Kategorie uczestników</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Zdefiniuj kategorie dla całego wydarzenia. W poszczególnych dystansach możesz
                  wyłączyć wybrane kategorie.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2.5 rounded-lg border px-3 py-2">
                <Switch
                  id="categories-enabled"
                  checked={form.categoriesEnabled}
                  onCheckedChange={form.setCategoriesEnabled}
                />
                <Label htmlFor="categories-enabled" className="cursor-pointer text-sm font-medium">
                  {form.categoriesEnabled ? 'Kategorie włączone' : 'Brak kategorii'}
                </Label>
                <FieldHelp description="Wyłącz, jeśli wydarzenie nie ma podziału na kategorie. Zdefiniowane kategorie zostaną zapamiętane, ale nie zostaną zapisane do bazy danych." />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-4 pt-0 sm:p-6 sm:pt-0">
            {!form.categoriesEnabled && (
              <Alert className="border-muted bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertTitle>Brak kategorii</AlertTitle>
                <AlertDescription>
                  Wydarzenie nie będzie miało podziału na kategorie. Uczestnicy nie będą wybierać
                  kategorii podczas rejestracji.
                </AlertDescription>
              </Alert>
            )}

            {form.categoriesEnabled && (
              <>
                {/* Base Categories */}
                <div className="space-y-3">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Label className="text-base font-medium">
                      Kategorie podstawowe ({form.ageCategories.length})
                    </Label>
                    <FieldHelp description="Kategorie grupujące uczestników, np. według wieku, płci lub typu open (W Open, M Open). Używane w zapisach, listach startowych i wynikach." />
                  </div>

                  {/* Category templates */}
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Szablony kategorii
                      </p>
                      <FieldHelp description="Kliknij szablon, aby zastąpić bieżące kategorie gotowym zestawem. Możesz go potem edytować." />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {AGE_CATEGORY_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.label}
                          type="button"
                          title={tpl.description}
                          onClick={() => form.setAgeCategories(tpl.generate(eventYear))}
                          className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                        >
                          <ListPlus className="h-3.5 w-3.5 shrink-0" />
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.ageCategories.length > 0 && (
                    <div className="space-y-2">
                      <div className="hidden gap-2 px-1 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1fr_80px_110px_110px_40px]">
                        <span className="flex items-center gap-1">
                          Nazwa
                          <FieldHelp description="Nazwa kategorii widoczna w zapisach i wynikach, np. K18-29, M40-49 albo W Open." />
                        </span>
                        <span className="flex items-center gap-1">
                          Płeć
                          <FieldHelp description="Opcjonalne. Określa, czy kategoria dotyczy kobiet (K) lub mężczyzn (M). Zostaw puste dla kategorii Open." />
                        </span>
                        <span className="flex items-center gap-1 gap-x-1">
                          {ageInputMode === 'year' ? 'Rok od' : 'Wiek od'}
                          <FieldHelp
                            description={
                              ageInputMode === 'year'
                                ? 'Najstarszy rocznik kwalifikujący się do tej kategorii.'
                                : 'Minimalny wiek uczestnika (zostanie przeliczony na rok urodzenia).'
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setAgeInputMode(ageInputMode === 'year' ? 'age' : 'year')
                            }
                            className="ml-auto rounded px-1 py-0.5 text-[10px] font-semibold text-primary underline-offset-2 hover:underline"
                          >
                            {ageInputMode === 'year' ? '→ wiek' : '→ rok'}
                          </button>
                        </span>
                        <span className="flex items-center gap-1">
                          {ageInputMode === 'year' ? 'Rok do' : 'Wiek do'}
                          <FieldHelp
                            description={
                              ageInputMode === 'year'
                                ? 'Najmłodszy rocznik kwalifikujący się do tej kategorii.'
                                : 'Maksymalny wiek uczestnika (zostanie przeliczony na rok urodzenia).'
                            }
                          />
                        </span>
                        <span></span>
                      </div>
                      {form.ageCategories.map((cat, catIdx) => (
                        <div
                          key={cat.id}
                          className="grid grid-cols-[minmax(0,1fr)_88px] items-center gap-2 md:grid-cols-[1fr_80px_110px_110px_40px]"
                        >
                          <Input
                            value={cat.name}
                            onChange={(e) => form.updateAgeCategory(catIdx, 'name', e.target.value)}
                            placeholder="np. W Open, M40-49"
                            className="h-9"
                          />
                          <Select
                            value={cat.gender ?? '__none__'}
                            onValueChange={(v) =>
                              form.updateAgeCategory(
                                catIdx,
                                'gender',
                                v === '__none__' ? null : (v as 'K' | 'M'),
                              )
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">—</SelectItem>
                              <SelectItem value="K">K</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={
                              ageInputMode === 'year'
                                ? (cat.birthYearFrom ?? '')
                                : cat.birthYearFrom != null
                                  ? yearToAge(cat.birthYearFrom)
                                  : ''
                            }
                            onChange={(e) => {
                              const raw =
                                e.target.value === '' ? null : parseInt(e.target.value) || 0;
                              const year =
                                raw == null ? null : ageInputMode === 'age' ? ageToYear(raw) : raw;
                              form.updateAgeCategory(catIdx, 'birthYearFrom', year);
                            }}
                            placeholder="—"
                            className="h-9"
                          />
                          <Input
                            type="number"
                            value={
                              ageInputMode === 'year'
                                ? (cat.birthYearTo ?? '')
                                : cat.birthYearTo != null
                                  ? yearToAge(cat.birthYearTo)
                                  : ''
                            }
                            onChange={(e) => {
                              const raw =
                                e.target.value === '' ? null : parseInt(e.target.value) || 0;
                              const year =
                                raw == null ? null : ageInputMode === 'age' ? ageToYear(raw) : raw;
                              form.updateAgeCategory(catIdx, 'birthYearTo', year);
                            }}
                            placeholder="—"
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
                      {ageInputMode === 'age' && (
                        <p className="px-1 text-xs text-muted-foreground">
                          Wartości przeliczane na rok urodzenia względem roku wydarzenia (
                          {eventYear}). Zapisywane jako roczniki.
                        </p>
                      )}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={form.addAgeCategory}
                    className="w-full text-primary sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Dodaj kategorię
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
                            onChange={(e) =>
                              form.updateSpecialCategory(catIdx, 'name', e.target.value)
                            }
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
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* DISTANCES */}
      {activeSubStep === 'distances' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Dystanse ({form.distances.length})</h2>
            <Button onClick={form.addDistance} variant="outline" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Dodaj dystans
            </Button>
          </div>

          <Card>
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">Popularne szablony dystansów</p>
                  <FieldHelp description="Kliknięcie dodaje nowy dystans z uzupełnioną nazwą i długością. Cena, limit i pozostałe dane nadal ustawiasz ręcznie." />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Szablony nie są ładowane automatycznie. To tylko skróty do najczęściej używanych
                  wariantów.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {DISTANCE_TEMPLATES.map((template) => (
                  <Button
                    key={`${template.name}-${template.length}-${template.unit}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.addDistanceFromTemplate(template)}
                    className="h-8"
                  >
                    <ListPlus className="mr-1.5 h-3.5 w-3.5" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

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
                    {dist.noName
                      ? formatDistanceName(dist.length, dist.unit) || `Dystans ${index + 1}`
                      : dist.name || `Dystans ${index + 1}`}
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
                    <HelpLabel
                      description="Nazwa wariantu startu widoczna przy zapisach, wynikach i na stronie wydarzenia, np. 5 km, Maraton albo Sprint."
                      title="Nazwa dystansu"
                    >
                      Nazwa dystansu{dist.noName ? '' : ' *'}
                    </HelpLabel>
                    {dist.noName ? (
                      <div className="flex h-9 items-center">
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceName(dist.length, dist.unit) || '—'}
                        </span>
                      </div>
                    ) : (
                      <Input
                        value={dist.name}
                        onChange={(e) => form.updateDistance(index, 'name', e.target.value)}
                        placeholder="np. Maraton"
                        className={inputError(!!fe[`distance_${index}_name`])}
                      />
                    )}
                    <FieldError message={fe[`distance_${index}_name`]} />
                    {!dist.noLength && dist.length && (
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                        <Checkbox
                          checked={dist.noName}
                          onCheckedChange={(checked) => {
                            form.updateDistance(index, 'noName', !!checked);
                            if (checked) form.updateDistance(index, 'name', '');
                          }}
                        />
                        <span>Bez dodatkowej nazwy</span>
                        <FieldHelp
                          title="Bez dodatkowej nazwy"
                          description='Zaznacz, jesli kilometraz wystarczy jako identyfikator dystansu - np. "5 km" zamiast "5 km / Dystans 5 km". Unikniesz powielania tej samej informacji w nazwie i w polu dlugosci.'
                        />
                      </label>
                    )}
                  </div>
                  <div className="space-y-2">
                    <HelpLabel description="Dlugosc dystansu wraz z jednostka. Zostaw puste, jezeli zawody nie sa rozgrywane na konkretny dystans (np. orientacja, zawody punktowe).">
                      Długość
                    </HelpLabel>
                    {dist.noLength ? (
                      <div className="flex h-9 items-center">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                          <Checkbox
                            checked
                            onCheckedChange={() => form.updateDistance(index, 'noLength', false)}
                          />
                          Brak dystansu
                        </label>
                      </div>
                    ) : (
                      <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-2">
                        <Input
                          type="number"
                          value={dist.length}
                          onChange={(e) => form.updateDistance(index, 'length', e.target.value)}
                          placeholder="42.195"
                          className={inputError(!!fe[`distance_${index}_length`])}
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
                    )}
                    {!dist.noLength && <FieldError message={fe[`distance_${index}_length`]} />}
                    {!dist.noLength && (
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => form.updateDistance(index, 'noLength', true)}
                        />
                        Brak dystansu (zawody bez określonej długości)
                      </label>
                    )}
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
                      className={inputError(!!fe[`distance_${index}_price`])}
                    />
                    <FieldError message={fe[`distance_${index}_price`]} />
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
                      className={inputError(!!fe[`distance_${index}_officePrice`])}
                    />
                    <FieldError message={fe[`distance_${index}_officePrice`]} />
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
                      className={inputError(!!fe[`distance_${index}_limit`])}
                    />
                    <FieldError message={fe[`distance_${index}_limit`]} />
                  </div>
                </div>

                <div className="space-y-2">
                  <HelpLabel description="Opcjonalny opis widoczny przy dystansie, np. limit wieku, charakter trasy, przewyższenia, wymagany sprzęt albo ważne zasady dla tego wariantu.">
                    Dodatkowe informacje o dystansie
                  </HelpLabel>
                  <RichTextEditor
                    value={dist.infoHtml}
                    onChange={(html) => form.updateDistance(index, 'infoHtml', html)}
                    placeholder="Wpisz informacje widoczne dla uczestników przy tym dystansie..."
                    minHeight="90px"
                  />
                </div>

                {/* Distance documents */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium">Dokumenty dystansu</Label>
                    <FieldHelp description="Wgraj dodatkowe dokumenty dla tego dystansu, np. regulamin, harmonogram lub mape trasy w PDF." />
                  </div>
                  {dist.distanceDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2 rounded-md border p-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {doc.name || doc.fileName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {DISTANCE_DOCUMENT_TYPE_LABELS[doc.type as DistanceDocumentType] ||
                            doc.type}
                        </div>
                      </div>
                      <Select
                        value={doc.type}
                        onValueChange={(v) => form.updateDistanceDocument(index, doc.id, 'type', v)}
                      >
                        <SelectTrigger className="h-8 w-[140px] shrink-0 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.entries(DISTANCE_DOCUMENT_TYPE_LABELS) as [
                              DistanceDocumentType,
                              string,
                            ][]
                          ).map(([value, label]) => (
                            <SelectItem key={value} value={value} className="text-xs">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={doc.name}
                        onChange={(e) =>
                          form.updateDistanceDocument(index, doc.id, 'name', e.target.value)
                        }
                        placeholder="Nazwa dokumentu"
                        className="h-8 w-[160px] shrink-0 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => form.removeDistanceDocument(index, doc.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <DistanceDocumentUploadButton
                    onUploaded={(doc) => form.addDistanceDocument(index, doc)}
                  />
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
                              <span>
                                {dist.priceTierMode === 'date' ? 'Obowiazuje do' : 'Limit'}
                              </span>
                              <span>Cena w progu</span>
                              <span>Opis</span>
                              <span></span>
                            </div>
                            {dist.priceTiers.map((tier) => {
                              const j = dist.priceTiers.findIndex((t) => t.id === tier.id);
                              const tierPrice =
                                tier.price ??
                                applyDiscount(
                                  Number(dist.price) || 0,
                                  tier.discountType,
                                  tier.discountValue,
                                );
                              const basePrice = Number(dist.price) || 0;
                              const priceWarning = tierPrice > basePrice;
                              const tierNameError = fe[`distance_${index}_tier_${j}_name`];
                              const tierDateError = fe[`distance_${index}_tier_${j}_endDate`];
                              const tierLimitError =
                                fe[`distance_${index}_tier_${j}_participantLimit`];
                              return (
                                <div
                                  key={tier.id}
                                  className="grid grid-cols-1 items-start gap-2 rounded-md border p-3 md:grid-cols-[1fr_150px_130px_1fr_40px]"
                                >
                                  <div className="space-y-1">
                                    <Input
                                      value={tier.name}
                                      onChange={(e) =>
                                        form.updatePriceTier(index, tier.id, {
                                          name: e.target.value,
                                        })
                                      }
                                      placeholder="np. Early Bird"
                                      className={`h-9 ${inputError(!!tierNameError)}`}
                                    />
                                    <FieldError message={tierNameError} />
                                  </div>
                                  <div className="space-y-1">
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
                                      className={`h-9 ${inputError(!!(tierDateError || tierLimitError))}`}
                                    />
                                    <FieldError message={tierDateError || tierLimitError} />
                                  </div>
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
                                        Cena progu jest wyzsza od ceny bazowej. To tylko
                                        ostrzezenie.
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
                      <RouteUrlOrUploadField
                        label="Mapa trasy"
                        description="Link do mapy trasy lub wgraj plik (obraz). Widoczne dla uczestnikow przed startem."
                        value={dist.routeMapUrl}
                        onChange={(v) => form.updateDistance(index, 'routeMapUrl', v)}
                      />
                      <RouteUrlOrUploadField
                        label="Profil przewyższeń"
                        description="Link do profilu przewyzszen lub wgraj plik (obraz). Przydatne dla tras gorskich i trailowych."
                        value={dist.routeElevationProfile}
                        onChange={(v) => form.updateDistance(index, 'routeElevationProfile', v)}
                      />
                      <RouteUrlOrUploadField
                        label="Plik GPX"
                        description="Link do pliku GPX lub wgraj plik GPX. Uczestnik moze pobrac do zegarka lub aplikacji treningowej."
                        value={dist.routeGpxUrl}
                        onChange={(v) => form.updateDistance(index, 'routeGpxUrl', v)}
                        acceptFiles=".gpx,application/gpx+xml"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs font-medium">Dodatkowe pliki trasy</Label>
                        <FieldHelp description="Dodaj kolejne materialy dla trasy z wyborem typu: mapa, profil przewyzszen, GPX, zdjecie, regulamin lub inny plik. Mozesz wgrac plik lub podac link." />
                      </div>
                      {dist.routeFiles.map((file) => (
                        <div
                          key={file.id}
                          className="grid grid-cols-1 items-start gap-2 rounded-md border p-3 sm:grid-cols-[1fr_auto]"
                        >
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_140px]">
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
                              placeholder="URL lub wgraj poniżej"
                              className="h-9 min-w-0"
                            />
                            <Select
                              value={file.type}
                              onValueChange={(v) =>
                                form.updateRouteFile(
                                  index,
                                  file.id,
                                  'type',
                                  v as DistanceRouteFileType,
                                )
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(
                                  Object.entries(DISTANCE_ROUTE_FILE_TYPE_LABELS) as [
                                    DistanceRouteFileType,
                                    string,
                                  ][]
                                ).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <RouteFileUploadButton
                            onUploaded={(url) => form.updateRouteFile(index, file.id, 'url', url)}
                          />
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
        </>
      )}
    </div>
  );
};
