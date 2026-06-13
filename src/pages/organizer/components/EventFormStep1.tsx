import { disciplineLabels } from '@/api';
import { useEffect, useState } from 'react';
import { uploadEventImage } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { SportDiscipline, PaymentConfigType } from '@/types';
import {
  Image,
  Upload,
  X,
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
} from 'lucide-react';
import { ImageCropper } from '@/components/ImageCropper';
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
}: EventImageUploadFieldProps) => {
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('event-image');
  const [showCropper, setShowCropper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
        <Button type="button" variant="outline" asChild disabled={isUploading}>
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            {value ? 'Zmien obraz' : 'Wgraj obraz'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => handleFileChange(event.target.files?.[0])}
            />
          </label>
        </Button>
        {value && (
          <Button type="button" variant="outline" size="icon" onClick={() => onChange('')}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {value && (
        <div className="overflow-hidden rounded-md border bg-muted" style={{ aspectRatio }}>
          <img src={value} alt="" className="h-full w-full object-cover" />
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

export const EventFormStep1 = ({ form }: EventFormStep1Props) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code className="h-5 w-5 text-primary" /> Typ zapisów
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
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
                </Label>
                <FieldHelp description="Zapisy sa obslugiwane przez formularz i platnosci w systemie Zmierzymy Czas." />
                <p className="mt-1 text-sm text-muted-foreground">
                  Uczestnik zapisuje się bezpośrednio w biurze zawodów.
                </p>
              </div>
            </div>
            <div
              className={`relative flex items-start gap-3 rounded-lg border p-4 transition-colors ${form.registrationMode === 'external_embed' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
            >
              <RadioGroupItem value="external_embed" id="registration_external" className="mt-1" />
              <div className="min-w-0 flex-1">
                <Label
                  htmlFor="registration_external"
                  className="flex cursor-pointer flex-wrap items-center gap-2 font-medium"
                >
                  <ExternalLink className="h-4 w-4 text-primary" /> Zewnętrzny formularz embed
                </Label>
                <FieldHelp description="Na stronie wydarzenia pokazujemy ramke Zmierzymy Czas, a w srodku osadzamy formularz zapisow z podanego linku." />
                <p className="mt-1 text-sm text-muted-foreground">
                  Zapisy prowadzi zewnętrzny system, widoczny u nas w osadzonej ramce.
                </p>
              </div>
            </div>
          </RadioGroup>

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
        </CardContent>
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
          />

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
              />
              <EventImageUploadField
                label="Logo organizatora"
                description="Logo wyswietlane przy wydarzeniu jako identyfikacja organizatora lub marki zawodow."
                recommendedSize="Zalecany format kwadratowy, minimum 400x400px."
                value={form.organizerLogoUrl}
                onChange={form.setOrganizerLogoUrl}
                aspectRatio={1}
                outputWidth={600}
                cropTitle="Dopasuj logo organizatora"
                toast={form.toast}
              />
            </div>
          </div>

          {/* Payment Configuration */}
          <div className="mt-6 border-t pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold sm:text-lg">
              <CreditCard className="h-5 w-5 shrink-0 text-primary" />
              Konfiguracja pĹ‚atnoĹ›ci
            </h3>
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
                    <CreditCard className="h-4 w-4 text-primary" /> Bramka pĹ‚atnicza (automatyczna)
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

      {/* Display Options */}
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
    </div>
  );
};
