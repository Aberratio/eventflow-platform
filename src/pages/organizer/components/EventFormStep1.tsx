import { disciplineLabels, uploadEventImage } from '@/api';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldHelp, HelpLabel } from '@/components/ui/field-help';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SportDiscipline, PaymentConfigType, OrganizerLogoShape } from '@/types';
import {
  Image,
  Upload,
  Trash2,
  Crop,
  Globe,
  CreditCard,
  Building2,
  FileText,
  Lock,
  Copy,
  RefreshCw,
  Code,
  Settings2,
  Monitor,
  ExternalLink,
  Calendar,
  MapPin,
  Info,
  ChevronDown,
  RectangleHorizontal,
  RectangleVertical,
  Square,
} from 'lucide-react';
import { ImageCropper } from '@/components/ImageCropper';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { EventFormState } from '../hooks/useEventFormState';

interface EventFormStep1Props {
  form: EventFormState;
}

interface EventImageUploadFieldProps {
  label: string;
  description: string;
  recommendedSize: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio: number;
  outputWidth: number;
  cropTitle: string;
  toast: EventFormState['toast'];
  showPreview?: boolean;
  previewClassName?: string;
  previewImageClassName?: string;
}

const EventImageUploadField = ({
  label,
  description,
  recommendedSize,
  value,
  onChange,
  aspectRatio,
  outputWidth,
  cropTitle,
  toast,
  showPreview = true,
  previewClassName,
  previewImageClassName = 'object-cover',
}: EventImageUploadFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('event-image');
  const [showCropper, setShowCropper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);

  useEffect(() => {
    return () => {
      if (selectedPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(selectedPreviewUrl);
    };
  }, [selectedPreviewUrl]);

  const handleFileChange = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Nieprawidlowy plik',
        description: 'Wybierz plik obrazu.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(selectedPreviewUrl);
    setSelectedFileName(file.name.replace(/\.[^.]+$/, '') || 'event-image');
    setSelectedPreviewUrl(URL.createObjectURL(file));
    setShowCropper(true);
  };

  const handleRemove = () => {
    if (selectedPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(selectedPreviewUrl);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSelectedPreviewUrl('');
    setShowCropper(false);
    onChange('');
  };

  const handleRecrop = async () => {
    if (!value) return;

    setIsPreparingCrop(true);
    try {
      const response = await fetch(value);
      if (!response.ok) throw new Error('Image fetch failed');

      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Unsupported image type');

      if (selectedPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(selectedPreviewUrl);
      setSelectedFileName('event-image');
      setSelectedPreviewUrl(URL.createObjectURL(blob));
      setShowCropper(true);
    } catch {
      toast({
        title: 'Nie udalo sie otworzyc kadrowania',
        description: 'Sprobuj ponownie wgrac obraz z pliku.',
        variant: 'destructive',
      });
    } finally {
      setIsPreparingCrop(false);
    }
  };

  const handleUpload = async (_crop: unknown, croppedBlob?: Blob) => {
    if (!croppedBlob) {
      toast({
        title: 'Nie udalo sie przyciac obrazu',
        description: 'Sprobuj wybrac plik ponownie.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const file = new File([croppedBlob], `${selectedFileName}.jpg`, { type: 'image/jpeg' });
      const response = await uploadEventImage(file);
      onChange(response.data.url);
      toast({
        title: 'Obraz zapisany',
        description: 'Wgrano i sformatowano obraz wydarzenia.',
      });
    } catch (error) {
      toast({
        title: 'Nie udalo sie wgrac obrazu',
        description: error instanceof Error ? error.message : 'Sprobuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <HelpLabel description={description}>{label}</HelpLabel>
      <p className="text-sm text-muted-foreground">{recommendedSize}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" asChild disabled={isUploading || isPreparingCrop}>
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            {value ? 'Zmien obraz' : 'Wgraj obraz'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                handleFileChange(event.target.files?.[0]);
                event.currentTarget.value = '';
              }}
            />
          </label>
        </Button>
        {value && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleRecrop}
              disabled={isUploading || isPreparingCrop}
            >
              <Crop className="mr-2 h-4 w-4" />
              {isPreparingCrop ? 'Otwieranie...' : 'Zmien przyciecie'}
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={handleRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      {showPreview && value && (
        <div
          className={`overflow-hidden rounded-md border bg-muted ${previewClassName ?? ''}`}
          style={{ aspectRatio }}
        >
          <img src={value} alt="" className={`h-full w-full ${previewImageClassName}`} />
        </div>
      )}
      {selectedPreviewUrl && (
        <ImageCropper
          imageUrl={selectedPreviewUrl}
          open={showCropper}
          onOpenChange={setShowCropper}
          aspectRatio={aspectRatio}
          outputWidth={outputWidth}
          title={cropTitle}
          onCrop={handleUpload}
        />
      )}
    </div>
  );
};

interface EventImagesPlacementPreviewProps {
  form: EventFormState;
}

const logoShapeOptions: Array<{
  value: OrganizerLogoShape;
  label: string;
  description: string;
  icon: typeof Square;
}> = [
  {
    value: 'square',
    label: 'Kwadrat',
    description: 'Dla symboli i znakow o rownych bokach.',
    icon: Square,
  },
  {
    value: 'landscape',
    label: 'Poziom',
    description: 'Dla szerokich logotypow z tekstem.',
    icon: RectangleHorizontal,
  },
  {
    value: 'portrait',
    label: 'Pion',
    description: 'Dla wysokich herbow i znakow pionowych.',
    icon: RectangleVertical,
  },
];

const getLogoShapeConfig = (shape: OrganizerLogoShape = 'square') => {
  switch (shape) {
    case 'landscape':
      return {
        aspectRatio: 16 / 9,
        outputWidth: 800,
        previewClassName: 'max-w-36',
        heroClassName: 'h-11 w-20 sm:h-14 sm:w-28 md:h-16 md:w-32',
        placeholderClassName: 'h-11 w-20 sm:h-14 sm:w-28 md:h-16 md:w-32',
      };
    case 'portrait':
      return {
        aspectRatio: 3 / 4,
        outputWidth: 600,
        previewClassName: 'max-w-20',
        heroClassName: 'h-16 w-12 sm:h-20 sm:w-[3.75rem] md:h-24 md:w-[4.5rem]',
        placeholderClassName: 'h-16 w-12 sm:h-20 sm:w-[3.75rem] md:h-24 md:w-[4.5rem]',
      };
    case 'square':
    default:
      return {
        aspectRatio: 1,
        outputWidth: 600,
        previewClassName: 'max-w-28',
        heroClassName: 'h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20',
        placeholderClassName: 'h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20',
      };
  }
};

const EmptyImagePreview = ({ label, className }: { label: string; className?: string }) => (
  <div
    className={`flex items-center justify-center bg-muted text-center text-xs text-muted-foreground ${className ?? ''}`}
  >
    {label}
  </div>
);

const MainEventImagePlacementPreview = ({ form }: EventImagesPlacementPreviewProps) => {
  const eventName = form.name || 'Nazwa wydarzenia';
  const eventDate = form.date || 'Data wydarzenia';
  const eventCity = form.isVirtual ? 'Wydarzenie wirtualne' : form.city || 'Miasto';

  return (
    <div className="max-w-xl rounded-md border bg-card p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Image className="h-3.5 w-3.5" />
        Glowny obraz poza hero
      </div>
      <div className="flex gap-3">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-muted">
          {form.imageUrl ? (
            <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <EmptyImagePreview label="glowny obraz" className="h-full px-2" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-medium">{eventName}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {eventDate}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {eventCity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EventImagesPlacementPreview = ({ form }: EventImagesPlacementPreviewProps) => {
  const heroImageUrl = form.bannerUrl || form.imageUrl;
  const eventName = form.name || 'Nazwa wydarzenia';
  const logoShape = getLogoShapeConfig(form.organizerLogoShape);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Podglad umiejscowienia obrazow</h4>
          <p className="text-xs text-muted-foreground">
            Tak baner i logo beda laczone na publicznej stronie wydarzenia.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Podglad
        </Badge>
      </div>

      <div className="overflow-hidden rounded-md border bg-background">
        <div className="relative aspect-[16/7] overflow-hidden bg-muted">
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <EmptyImagePreview
              label="Hero strony wydarzenia: najpierw baner, a gdy go nie ma - glowny obraz"
              className="absolute inset-0 px-4"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
          {form.organizerLogoUrl ? (
            <img
              src={form.organizerLogoUrl}
              alt=""
              className={`absolute right-3 top-3 rounded-lg border-2 border-background bg-background/90 object-contain p-1 shadow-md ${logoShape.heroClassName}`}
            />
          ) : (
            <div
              className={`absolute right-3 top-3 flex items-center justify-center rounded-lg border-2 border-background bg-background/80 text-center text-[9px] leading-tight text-muted-foreground shadow-md ${logoShape.placeholderClassName}`}
            >
              logo
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Badge className="bg-background/85 text-[10px] backdrop-blur-sm">
                <DisciplineIcon discipline={form.discipline} size="sm" className="mr-1 h-3 w-3" />
                {disciplineLabels[form.discipline]}
              </Badge>
              {form.isVirtual && (
                <Badge variant="outline" className="bg-background/80 text-[10px]">
                  <Globe className="mr-1 h-3 w-3" />
                  Wirtualne
                </Badge>
              )}
            </div>
            <div className="line-clamp-1 text-base font-bold sm:text-lg">{eventName}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Organizator:{' '}
              {form.organizers.find((o) => o.id === form.selectedOrganizerId)?.companyName ||
                form.organizers.find((o) => o.id === form.selectedOrganizerId)?.name ||
                'organizator'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EventFormStep1 = ({ form }: EventFormStep1Props) => {
  const isEmbedRegistration = form.registrationMode === 'external_embed';
  const [registrationTypeOpen, setRegistrationTypeOpen] = useState(false);
  const logoShapeConfig = getLogoShapeConfig(form.organizerLogoShape);
  const registrationTypeLabel = isEmbedRegistration
    ? 'Zewnetrzny formularz embed'
    : 'Formularz Zmierzymy Czas';
  const registrationTypeSummary = isEmbedRegistration
    ? 'Zapisy po stronie organizatora lub zewnetrznego systemu'
    : 'Zapisy po stronie Zmierzymy Czas';

  return (
    <div className="space-y-6">
      <Card>
        <Collapsible open={registrationTypeOpen} onOpenChange={setRegistrationTypeOpen}>
          <CardHeader className="p-4 pb-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Code className="h-5 w-5 text-primary" /> Typ zawodow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="group flex w-full items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span>{registrationTypeSummary}</span>
                    <Badge
                      variant={isEmbedRegistration ? 'outline' : 'secondary'}
                      className="text-[10px]"
                    >
                      {registrationTypeLabel}
                    </Badge>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4">
              <RadioGroup
                value={form.registrationMode}
                onValueChange={(value) =>
                  form.setRegistrationMode(value as 'internal' | 'external_embed')
                }
                className="grid gap-3 md:grid-cols-2"
              >
                <div
                  className={`relative flex items-start gap-3 rounded-lg border p-4 transition-colors ${form.registrationMode === 'internal' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
                >
                  <RadioGroupItem value="internal" id="registration_internal" className="mt-1" />
                  <div className="min-w-0 flex-1">
                    <Label
                      htmlFor="registration_internal"
                      className="flex cursor-pointer flex-wrap items-center gap-2 font-medium"
                    >
                      <Settings2 className="h-4 w-4 text-primary" /> Formularz Zmierzymy Czas
                      <Badge variant="secondary" className="text-[10px]">
                        najczestszy wybor
                      </Badge>
                    </Label>
                    <FieldHelp description="Zapisy sa obslugiwane przez formularz i platnosci w systemie Zmierzymy Czas." />
                    <p className="mt-1 text-sm text-muted-foreground">
                      Uczestnik zapisuje sie bezposrednio w biurze zawodow.
                    </p>
                  </div>
                </div>
                <div
                  className={`relative flex items-start gap-3 rounded-lg border p-4 transition-colors ${form.registrationMode === 'external_embed' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
                >
                  <RadioGroupItem
                    value="external_embed"
                    id="registration_external"
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <Label
                      htmlFor="registration_external"
                      className="flex cursor-pointer flex-wrap items-center gap-2 font-medium"
                    >
                      <ExternalLink className="h-4 w-4 text-primary" /> Zewnetrzny formularz embed
                    </Label>
                    <FieldHelp description="Na stronie wydarzenia pokazujemy ramke Zmierzymy Czas, a w srodku osadzamy formularz zapisow z podanego linku." />
                    <p className="mt-1 text-sm text-muted-foreground">
                      Zmierzymy Czas nie dostarcza formularza zapisow w tym wariancie. Zapisy,
                      platnosci i lista uczestnikow sa w calosci po stronie organizatora lub
                      zewnetrznego systemu.
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {isEmbedRegistration && (
                <Alert className="border-primary/30 bg-primary/5">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Embed: zapisy sa po stronie organizatora</AlertTitle>
                  <AlertDescription>
                    Dla zawodow typu embed nie pokazujemy konfiguracji formularza rejestracji, pol
                    platnosci ani opcji publicznej listy uczestnikow. Zmierzymy Czas pokazuje tylko
                    osadzony formularz z podanego linku.
                  </AlertDescription>
                </Alert>
              )}

              {form.registrationMode === 'external_embed' && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <HelpLabel
                      htmlFor="externalRegistrationUrl"
                      description="Pelny adres strony lub formularza zapisow, ktory ma zostac osadzony w widoku wydarzenia."
                    >
                      Link do zewnętrznego formularza *
                    </HelpLabel>
                    <Input
                      id="externalRegistrationUrl"
                      value={form.externalRegistrationUrl}
                      onChange={(e) => form.setExternalRegistrationUrl(e.target.value)}
                      placeholder="https://partner.pl/zapisy/nazwa-wydarzenia"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <HelpLabel description="Opcjonalny poczatek dostepnosci osadzonego formularza zapisow na stronie wydarzenia.">
                        Data rozpoczęcia (opcjonalnie)
                      </HelpLabel>
                      <Input
                        type="date"
                        value={form.embedStartDate}
                        onChange={(e) => form.setEmbedStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <HelpLabel description="Opcjonalny koniec dostepnosci osadzonego formularza zapisow na stronie wydarzenia.">
                        Data zakończenia (opcjonalnie)
                      </HelpLabel>
                      <Input
                        type="date"
                        value={form.embedEndDate}
                        onChange={(e) => form.setEmbedEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </CardContent>
        </Collapsible>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6">
          <CardTitle>Podstawowe informacje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="grid gap-4 md:grid-cols-2">
            {form.canChooseOrganizer && (
              <div className="space-y-2 md:col-span-2">
                <HelpLabel
                  htmlFor="organizer"
                  description="Wskazuje konto organizatora, do ktorego zostanie przypisane wydarzenie, limit wydarzen i pozniejsze zarzadzanie."
                >
                  Organizator *
                </HelpLabel>
                <Select
                  value={form.selectedOrganizerId}
                  onValueChange={form.setSelectedOrganizerId}
                >
                  <SelectTrigger id="organizer">
                    <SelectValue placeholder="Wybierz organizatora" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.organizers.map((organizer) => (
                      <SelectItem key={organizer.id} value={organizer.id}>
                        {organizer.companyName || organizer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="md:col-span-2">
              <p
                className={
                  form.selectedEventLimit && form.selectedEventLimit.available <= 0
                    ? 'text-sm text-destructive'
                    : 'text-sm text-muted-foreground'
                }
              >
                {form.selectedEventLimit
                  ? `Limit wydarzeń: wykorzystano ${form.selectedEventLimit.used} z ${form.selectedEventLimit.limit}. Dostępne: ${form.selectedEventLimit.available}.`
                  : 'Ładowanie limitu wydarzeń...'}
              </p>
            </div>
            <div className="space-y-2">
              <HelpLabel
                htmlFor="name"
                description="Publiczna nazwa wydarzenia widoczna na listach, stronie szczegolow, w rejestracji i komunikacji z uczestnikami."
              >
                Nazwa wydarzenia *
              </HelpLabel>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => form.setName(e.target.value)}
                placeholder="np. Warsaw Marathon 2025"
              />
            </div>
            <div className="space-y-2">
              <HelpLabel
                htmlFor="discipline"
                description="Okresla typ sportu. Wplywa na ikony, filtry wydarzen i sposob prezentacji wydarzenia w serwisie."
              >
                Dyscyplina *
              </HelpLabel>
              <Select
                value={form.discipline}
                onValueChange={(v: SportDiscipline) => form.setDiscipline(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(disciplineLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <HelpLabel
                htmlFor="date"
                description="Glowna data startu wydarzenia pokazywana uczestnikom w kalendarzu, listach wydarzen i szczegolach zawodow."
              >
                Data wydarzenia *
              </HelpLabel>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => form.setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <HelpLabel
                htmlFor="deadline"
                description="Ostatni dzien, w ktorym uczestnicy moga zapisac sie na wydarzenie, jesli zapisy sa otwarte."
              >
                Termin rejestracji *
              </HelpLabel>
              <Input
                id="deadline"
                type="date"
                value={form.registrationDeadline}
                onChange={(e) => form.setRegistrationDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Virtual event toggle */}
          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="isVirtual"
                checked={form.isVirtual}
                onCheckedChange={(checked) => {
                  form.setIsVirtual(checked === true);
                  if (checked) {
                    form.setLocation('Wydarzenie wirtualne');
                    form.setCity('CaĹ‚y Ĺ›wiat');
                  } else {
                    form.setLocation('');
                    form.setCity('');
                  }
                }}
              />
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-primary" />
                <Label htmlFor="isVirtual" className="cursor-pointer font-medium">
                  Wydarzenie wirtualne
                </Label>
                <FieldHelp description="Wlaczenie tej opcji oznacza, ze uczestnik realizuje aktywnosc samodzielnie poza jedna fizyczna lokalizacja i moze podac wynik w okreslonym oknie." />
              </div>
            </div>
            {form.isVirtual && (
              <p className="text-sm text-muted-foreground sm:pl-7">
                Uczestnicy wykonujÄ… aktywnoĹ›Ä‡ samodzielnie w dowolnym miejscu i wprowadzajÄ…
                swoje wyniki po zakoĹ„czeniu okna czasowego.
              </p>
            )}
          </div>

          {form.isVirtual && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <HelpLabel
                  htmlFor="startDate"
                  description="Pierwszy dzien, od ktorego uczestnicy wydarzenia wirtualnego moga wykonywac aktywnosc i przesylac wynik."
                >
                  Data rozpoczÄ™cia okna *
                </HelpLabel>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => form.setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <HelpLabel
                  htmlFor="endDate"
                  description="Ostatni dzien okna wirtualnego. Po tej dacie uczestnicy nie powinni juz dodawac nowych wynikow dla tego wydarzenia."
                >
                  Data zakoĹ„czenia okna *
                </HelpLabel>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => form.setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Private event toggle */}
          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="isPrivate"
                checked={form.isPrivate}
                onCheckedChange={(checked) => {
                  const val = checked === true;
                  form.setIsPrivate(val);
                  if (val && !form.accessCode) form.setAccessCode(form.generateAccessCode());
                }}
              />
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Lock className="h-4 w-4 shrink-0 text-primary" />
                <Label htmlFor="isPrivate" className="cursor-pointer font-medium">
                  Wydarzenie prywatne
                </Label>
                <FieldHelp description="Ukrywa wydarzenie z publicznych list. Dostep maja tylko osoby, ktore otrzymaja specjalny link z kodem dostepu." />
              </div>
            </div>
            {form.isPrivate && (
              <div className="space-y-3 sm:pl-7">
                <p className="text-sm text-muted-foreground">
                  Prywatne wydarzenie nie bÄ™dzie widoczne publicznie. Uczestnicy mogÄ… doĹ‚Ä…czyÄ‡
                  tylko przez specjalny link.
                </p>
                <div className="space-y-2">
                  <HelpLabel
                    htmlFor="accessCode"
                    description="Kod dodawany do prywatnego linku wydarzenia. Pozwala uczestnikom wejsc na strone wydarzenia mimo braku widocznosci publicznej."
                  >
                    Kod dostÄ™pu
                  </HelpLabel>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
                    <Input
                      id="accessCode"
                      value={form.accessCode}
                      onChange={(e) => form.setAccessCode(e.target.value)}
                      placeholder="np. abc123xyz"
                      className="min-w-0 font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => form.setAccessCode(form.generateAccessCode())}
                      title="Wygeneruj nowy kod"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const slug = form.name ? form.generateSlug(form.name) : 'wydarzenie';
                        const url = `${window.location.origin}/events/${slug}?access=${form.accessCode}`;
                        navigator.clipboard.writeText(url);
                        form.toast({
                          title: 'Skopiowano',
                          description:
                            'Link do prywatnego wydarzenia zostaĹ‚ skopiowany do schowka.',
                        });
                      }}
                      title="Kopiuj link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!form.isVirtual && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <HelpLabel
                  htmlFor="location"
                  description="Dokladne miejsce startu lub centrum wydarzenia, np. stadion, park, hala albo adres punktu zbiorczego."
                >
                  Lokalizacja (miejsce startu) *
                </HelpLabel>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => form.setLocation(e.target.value)}
                  placeholder="np. Stadion Narodowy"
                />
              </div>
              <div className="space-y-2">
                <HelpLabel
                  htmlFor="city"
                  description="Miasto wykorzystywane w filtrach, listach wydarzen i skroconych informacjach o lokalizacji."
                >
                  Miasto *
                </HelpLabel>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => form.setCity(e.target.value)}
                  placeholder="np. Warszawa"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <HelpLabel
              htmlFor="description"
              description="Sformatowany opis widoczny na stronie wydarzenia. Warto opisac trase, charakter zawodow, atrakcje i najwazniejsze informacje dla uczestnika."
            >
              Opis wydarzenia
            </HelpLabel>
            <RichTextEditor
              value={form.description}
              onChange={form.setDescription}
              placeholder="Opisz szczegĂłĹ‚y wydarzenia, trasÄ™, atrakcje..."
              minHeight="140px"
            />
          </div>

          <EventImageUploadField
            label="Glowny obraz wydarzenia"
            description="Obraz uzywany w widokach publicznych, kartach i materialach promocyjnych w aplikacji."
            recommendedSize="Zalecany format 16:9. Po wgraniu dopasujesz kadr przed zapisem."
            value={form.imageUrl}
            onChange={form.setImageUrl}
            aspectRatio={16 / 9}
            outputWidth={1200}
            cropTitle="Dopasuj glowny obraz wydarzenia"
            toast={form.toast}
            showPreview={false}
          />
          <MainEventImagePlacementPreview form={form} />

          {form.canManageFeatured && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="featured"
                checked={form.featured}
                onCheckedChange={(checked) => form.setFeatured(checked === true)}
              />
              <Label htmlFor="featured" className="cursor-pointer leading-5">
                WyrĂłĹĽnij wydarzenie na stronie gĹ‚Ăłwnej
              </Label>
              <FieldHelp description="Oznacza wydarzenie jako promowane. Moze pojawic sie wyzej lub w specjalnych sekcjach strony glownej." />
            </div>
          )}

          {/* Media Section */}
          <div className="mt-6 border-t pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold sm:text-lg">
              <Image className="h-5 w-5 shrink-0 text-primary" />
              Media wydarzenia (opcjonalne)
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <EventImageUploadField
                label="Baner wydarzenia"
                description="Obraz wykorzystywany jako baner wizualny wydarzenia w miejscach, gdzie potrzebna jest mocniejsza ekspozycja."
                recommendedSize="Zalecany format 16:9, minimum 1200px szerokosci."
                value={form.bannerUrl}
                onChange={(url) => {
                  form.setBannerUrl(url);
                  form.setBannerCropArea(undefined);
                }}
                aspectRatio={16 / 9}
                outputWidth={1600}
                cropTitle="Dopasuj baner wydarzenia"
                toast={form.toast}
                previewClassName="max-w-64"
              />
              <div className="space-y-4">
                <div className="space-y-3">
                  <HelpLabel description="Wybierz uklad najblizszy realnym proporcjom logo. Ten wybor wplywa na kadrowanie, podglad i wyswietlanie na stronie wydarzenia.">
                    Typ logo organizatora
                  </HelpLabel>
                  <RadioGroup
                    value={form.organizerLogoShape}
                    onValueChange={(value) =>
                      form.setOrganizerLogoShape(value as OrganizerLogoShape)
                    }
                    className="grid gap-2 sm:grid-cols-3"
                  >
                    {logoShapeOptions.map((option) => {
                      const Icon = option.icon;
                      const id = `organizer-logo-shape-${option.value}`;

                      return (
                        <div
                          key={option.value}
                          className={`relative flex items-start gap-2 rounded-lg border p-3 transition-colors ${
                            form.organizerLogoShape === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-muted-foreground/50'
                          }`}
                        >
                          <RadioGroupItem value={option.value} id={id} className="mt-1" />
                          <Label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                            <span className="flex items-center gap-1.5 text-sm font-medium">
                              <Icon className="h-4 w-4 text-primary" />
                              {option.label}
                            </span>
                            <span className="mt-1 block text-xs font-normal leading-4 text-muted-foreground">
                              {option.description}
                            </span>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                <EventImageUploadField
                  label="Logo organizatora"
                  description="Logo wyswietlane przy wydarzeniu jako identyfikacja organizatora lub marki zawodow."
                  recommendedSize="Wybierz typ logo powyzej, a po wgraniu dopasujesz kadr do wybranych proporcji."
                  value={form.organizerLogoUrl}
                  onChange={form.setOrganizerLogoUrl}
                  aspectRatio={logoShapeConfig.aspectRatio}
                  outputWidth={logoShapeConfig.outputWidth}
                  cropTitle="Dopasuj logo organizatora"
                  toast={form.toast}
                  previewClassName={logoShapeConfig.previewClassName}
                  previewImageClassName="bg-background object-contain p-1"
                />
              </div>
            </div>
            <div className="mt-6">
              <EventImagesPlacementPreview form={form} />
            </div>
          </div>

          {/* Payment Configuration */}
          <div className="mt-6 border-t pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold sm:text-lg">
              <CreditCard className="h-5 w-5 shrink-0 text-primary" />
              Konfiguracja pĹ‚atnoĹ›ci
            </h3>
            {isEmbedRegistration ? (
              <Alert className="border-muted bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertTitle>Platnosci poza Zmierzymy Czas</AlertTitle>
                <AlertDescription>
                  Przy embedzie organizator sam ustala sposob przyjmowania oplat i rozlicza
                  uczestnikow poza tym systemem. Dlatego nie wymagamy danych bramki, konta bankowego
                  ani tytulu przelewu.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Wybierz sposĂłb przyjmowania pĹ‚atnoĹ›ci od uczestnikĂłw
                </p>
                <RadioGroup
                  value={form.paymentConfigType}
                  onValueChange={(value: PaymentConfigType) => form.setPaymentConfigType(value)}
                  className="space-y-4"
                >
                  <div
                    className={`relative flex items-start gap-3 rounded-lg border p-4 transition-colors ${form.paymentConfigType === 'admin_gateway' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
                  >
                    <RadioGroupItem value="admin_gateway" id="admin_gateway" className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <Label
                        htmlFor="admin_gateway"
                        className="flex cursor-pointer flex-wrap items-center gap-2 font-medium"
                      >
                        <CreditCard className="h-4 w-4 text-primary" /> Bramka pĹ‚atnicza
                        (automatyczna)
                      </Label>
                      <FieldHelp description="Platnosci sa obslugiwane przez bramke administratora serwisu. Organizator nie musi recznie potwierdzac przelewow." />
                      <p className="mt-1 text-sm text-muted-foreground">
                        PĹ‚atnoĹ›ci sÄ… przetwarzane automatycznie przez bramkÄ™ pĹ‚atniczÄ…
                        administratora serwisu.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`relative flex items-start gap-3 rounded-lg border p-4 transition-colors ${form.paymentConfigType === 'organizer_bank' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
                  >
                    <RadioGroupItem value="organizer_bank" id="organizer_bank" className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <Label
                        htmlFor="organizer_bank"
                        className="flex cursor-pointer flex-wrap items-center gap-2 font-medium"
                      >
                        <Building2 className="h-4 w-4 text-primary" /> Przelew bankowy (rÄ™czny)
                      </Label>
                      <FieldHelp description="Uczestnik dostaje dane do przelewu na konto organizatora, a status platnosci trzeba pozniej potwierdzac recznie." />
                      <p className="mt-1 text-sm text-muted-foreground">
                        Uczestnicy wpĹ‚acajÄ… na Twoje konto bankowe. Musisz rÄ™cznie potwierdzaÄ‡
                        otrzymane wpĹ‚aty.
                      </p>
                      {form.paymentConfigType === 'organizer_bank' && (
                        <div className="mt-4 space-y-4 border-t border-dashed pt-4">
                          <div className="space-y-2">
                            <HelpLabel
                              htmlFor="bankAccountNumber"
                              description="Numer rachunku, na ktory uczestnicy beda wysylac oplaty startowe przy platnosci przelewem bankowym."
                            >
                              Numer konta bankowego *
                            </HelpLabel>
                            <Input
                              id="bankAccountNumber"
                              value={form.bankAccountNumber}
                              onChange={(e) => form.setBankAccountNumber(e.target.value)}
                              placeholder="PL 00 0000 0000 0000 0000 0000 0000"
                            />
                            <p className="text-xs text-muted-foreground">
                              Podaj peĹ‚ny numer konta w formacie IBAN
                            </p>
                          </div>
                          <div className="space-y-2">
                            <HelpLabel
                              htmlFor="bankAccountHolder"
                              description="Nazwa odbiorcy przelewu widoczna dla uczestnika w instrukcji platnosci."
                            >
                              WĹ‚aĹ›ciciel konta *
                            </HelpLabel>
                            <Input
                              id="bankAccountHolder"
                              value={form.bankAccountHolder}
                              onChange={(e) => form.setBankAccountHolder(e.target.value)}
                              placeholder="Nazwa firmy lub ImiÄ™ Nazwisko"
                            />
                          </div>
                          <div className="space-y-2">
                            <HelpLabel
                              htmlFor="transferTitle"
                              description="Szablon tytulu przelewu pokazywany uczestnikowi. Zmienne zostana podstawione danymi wydarzenia, dystansu i uczestnika."
                            >
                              WzĂłr tytuĹ‚u przelewu
                            </HelpLabel>
                            <Input
                              id="transferTitle"
                              value={form.transferTitle}
                              onChange={(e) => form.setTransferTitle(e.target.value)}
                              placeholder="OpĹ‚ata za {eventName} - {participantName}"
                            />
                            <p className="text-xs text-muted-foreground">
                              DostÄ™pne zmienne: {'{eventName}'}, {'{participantName}'},{' '}
                              {'{distanceName}'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </RadioGroup>
              </>
            )}
          </div>

          {/* Rich Text Fields */}
          <div className="mt-6 border-t pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold sm:text-lg">
              <FileText className="h-5 w-5 shrink-0 text-primary" /> Dodatkowe informacje
              (opcjonalne)
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Te pola pozwalajÄ… na formatowanie tekstu, dodawanie linkĂłw i list.
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <HelpLabel description="Sformatowana sekcja na stronie wydarzenia. Mozesz wpisac organizatorow, partnerow, sponsorow i dodac linki.">
                  Organizatorzy
                </HelpLabel>
                <p className="text-sm text-muted-foreground">
                  MoĹĽesz wpisaÄ‡ wielu organizatorĂłw, sponsorĂłw z linkami do ich stron.
                </p>
                <RichTextEditor
                  value={form.organizersHtml}
                  onChange={form.setOrganizersHtml}
                  placeholder="Wpisz informacje o organizatorach..."
                  minHeight="100px"
                />
              </div>
              <div className="space-y-2">
                <HelpLabel description="Tresci regulaminowe lub linki do dokumentow, ktore uczestnik powinien przeczytac przed zapisem.">
                  Regulamin
                </HelpLabel>
                <p className="text-sm text-muted-foreground">
                  Wpisz treĹ›Ä‡ regulaminu lub dodaj linki do plikĂłw PDF.
                </p>
                <RichTextEditor
                  value={form.rulesHtml}
                  onChange={form.setRulesHtml}
                  placeholder="Wpisz regulamin lub dodaj linki do dokumentĂłw..."
                  minHeight="120px"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="requireFinalAcceptance"
                    checked={form.requireFinalAcceptance}
                    onCheckedChange={(checked) => form.setRequireFinalAcceptance(checked === true)}
                  />
                  <Label htmlFor="requireFinalAcceptance" className="cursor-pointer leading-5">
                    Wymagaj dodatkowej akceptacji przy rejestracji
                  </Label>
                  <FieldHelp description="Dodaje do formularza zapisu dodatkowy checkbox z trescia, ktora uczestnik musi zaakceptowac przed wyslaniem rejestracji." />
                </div>
                {form.requireFinalAcceptance && (
                  <div className="space-y-2 sm:pl-7">
                    <HelpLabel description="Tresci widoczna przy dodatkowym checkboxie akceptacji w formularzu rejestracji uczestnika.">
                      Tekst akceptacji
                    </HelpLabel>
                    <p className="text-sm text-muted-foreground">
                      Ten tekst pojawi siÄ™ jako checkbox, ktĂłry uczestnik musi zaakceptowaÄ‡ przy
                      rejestracji.
                    </p>
                    <RichTextEditor
                      value={form.finalAcceptanceHtml}
                      onChange={form.setFinalAcceptanceHtml}
                      placeholder="OĹ›wiadczam, ĹĽe zapoznaĹ‚em siÄ™ z regulaminem..."
                      minHeight="100px"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Form Config */}
      {!isEmbedRegistration && (
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-primary" /> Konfiguracja formularza rejestracji
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-sm text-muted-foreground">
              Wybierz, ktĂłre pola bÄ™dÄ… widoczne w formularzu rejestracji dla uczestnikĂłw.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: 'collectPhone' as const, label: 'Telefon kontaktowy' },
                { key: 'collectClub' as const, label: 'Klub / organizacja' },
                { key: 'collectBirthDate' as const, label: 'Data urodzenia' },
                { key: 'collectTeam' as const, label: 'Zapis druĹĽynowy' },
                { key: 'collectInsurance' as const, label: 'Ubezpieczenie NNW' },
                { key: 'collectMerchandise' as const, label: 'GadĹĽety / merchandise' },
              ].map((field) => (
                <div
                  key={field.key}
                  className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted/50"
                >
                  <Checkbox
                    id={field.key}
                    checked={form.formConfig[field.key]}
                    onCheckedChange={(checked) =>
                      form.setFormConfig({ ...form.formConfig, [field.key]: !!checked })
                    }
                  />
                  <Label htmlFor={field.key} className="cursor-pointer text-sm leading-5">
                    {field.label}
                  </Label>
                  <FieldHelp
                    description={
                      {
                        collectPhone:
                          'Wlacza pole telefonu kontaktowego w formularzu zapisu uczestnika.',
                        collectClub: 'Wlacza pole klubu, druzyny lub organizacji uczestnika.',
                        collectBirthDate:
                          'Wlacza pole daty urodzenia potrzebne m.in. do kategorii wiekowych.',
                        collectTeam:
                          'Pozwala uczestnikom podac informacje potrzebne do zapisu druzynowego.',
                        collectInsurance:
                          'Pokazuje uczestnikowi opcje zwiazane z ubezpieczeniem NNW, jesli sa skonfigurowane.',
                        collectMerchandise:
                          'Pokazuje uczestnikowi gadzety lub merchandise dostepne przy rejestracji.',
                      }[field.key]
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display Options */}
      {!isEmbedRegistration && (
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Monitor className="h-5 w-5 text-primary" /> Opcje wyĹ›wietlania listy uczestnikĂłw
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-2">
              <HelpLabel description="Ustala domyslny porzadek publicznej listy uczestnikow wydarzenia. Uzytkownik zobaczy liste wedlug tej preferencji.">
                DomyĹ›lne sortowanie
              </HelpLabel>
              <Select
                value={form.displayOptions.defaultSort}
                onValueChange={(v) =>
                  form.setDisplayOptions({
                    ...form.displayOptions,
                    defaultSort: v as 'name' | 'bib' | 'date' | 'distance',
                  })
                }
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Po imieniu</SelectItem>
                  <SelectItem value="bib">Po numerze startowym</SelectItem>
                  <SelectItem value="date">Po dacie zapisu</SelectItem>
                  <SelectItem value="distance">Po dystansie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex cursor-pointer items-start gap-2">
              <Checkbox
                id="uppercaseNames"
                checked={form.displayOptions.uppercaseNames}
                onCheckedChange={(checked) =>
                  form.setDisplayOptions({ ...form.displayOptions, uppercaseNames: !!checked })
                }
              />
              <Label htmlFor="uppercaseNames" className="cursor-pointer text-sm leading-5">
                WymuĹ› wielkie litery w nazwiskach (np. Jan KOWALSKI)
              </Label>
              <FieldHelp description="Formatuje nazwiska na liscie uczestnikow wielkimi literami, aby ulatwic skanowanie list startowych." />
            </div>
            <div className="flex cursor-pointer items-start gap-2">
              <Checkbox
                id="hideUnpaid"
                checked={form.displayOptions.hideUnpaid}
                onCheckedChange={(checked) =>
                  form.setDisplayOptions({ ...form.displayOptions, hideUnpaid: !!checked })
                }
              />
              <Label htmlFor="hideUnpaid" className="cursor-pointer text-sm leading-5">
                Ukryj nieopĹ‚aconych uczestnikĂłw na liĹ›cie publicznej
              </Label>
              <FieldHelp description="Nie pokazuje uczestnikow oczekujacych na platnosc na publicznej liscie startowej." />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
