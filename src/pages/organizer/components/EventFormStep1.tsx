import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SportDiscipline, PaymentConfigType } from '@/types';
import { disciplineLabels } from '@/api/mock/labels';
import { Image, Crop, Globe, CreditCard, Building2, FileText, Lock, Copy, RefreshCw, Code, Settings2, Monitor } from 'lucide-react';
import { ImageCropper } from '@/components/ImageCropper';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { EventFormState } from '../hooks/useEventFormState';

interface EventFormStep1Props {
  form: EventFormState;
}

export const EventFormStep1 = ({ form }: EventFormStep1Props) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Podstawowe informacje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa wydarzenia *</Label>
              <Input id="name" value={form.name} onChange={e => form.setName(e.target.value)} placeholder="np. Warsaw Marathon 2025" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discipline">Dyscyplina *</Label>
              <Select value={form.discipline} onValueChange={(v: SportDiscipline) => form.setDiscipline(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(disciplineLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data wydarzenia *</Label>
              <Input id="date" type="date" value={form.date} onChange={e => form.setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Termin rejestracji *</Label>
              <Input id="deadline" type="date" value={form.registrationDeadline} onChange={e => form.setRegistrationDeadline(e.target.value)} />
            </div>
          </div>

          {/* Virtual event toggle */}
          <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="isVirtual"
                checked={form.isVirtual}
                onCheckedChange={(checked) => {
                  form.setIsVirtual(checked === true);
                  if (checked) { form.setLocation('Wydarzenie wirtualne'); form.setCity('Cały świat'); }
                  else { form.setLocation(''); form.setCity(''); }
                }}
              />
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <Label htmlFor="isVirtual" className="cursor-pointer font-medium">Wydarzenie wirtualne</Label>
              </div>
            </div>
            {form.isVirtual && (
              <p className="text-sm text-muted-foreground pl-6">
                Uczestnicy wykonują aktywność samodzielnie w dowolnym miejscu i wprowadzają swoje wyniki po zakończeniu okna czasowego.
              </p>
            )}
          </div>

          {form.isVirtual && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data rozpoczęcia okna *</Label>
                <Input id="startDate" type="date" value={form.startDate} onChange={e => form.setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data zakończenia okna *</Label>
                <Input id="endDate" type="date" value={form.endDate} onChange={e => form.setEndDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Private event toggle */}
          <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="isPrivate"
                checked={form.isPrivate}
                onCheckedChange={(checked) => {
                  const val = checked === true;
                  form.setIsPrivate(val);
                  if (val && !form.accessCode) form.setAccessCode(form.generateAccessCode());
                }}
              />
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <Label htmlFor="isPrivate" className="cursor-pointer font-medium">Wydarzenie prywatne</Label>
              </div>
            </div>
            {form.isPrivate && (
              <div className="pl-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Prywatne wydarzenie nie będzie widoczne publicznie. Uczestnicy mogą dołączyć tylko przez specjalny link.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Kod dostępu</Label>
                  <div className="flex gap-2">
                    <Input id="accessCode" value={form.accessCode} onChange={e => form.setAccessCode(e.target.value)} placeholder="np. abc123xyz" className="font-mono" />
                    <Button type="button" variant="outline" size="icon" onClick={() => form.setAccessCode(form.generateAccessCode())} title="Wygeneruj nowy kod">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => {
                      const slug = form.name ? form.generateSlug(form.name) : 'wydarzenie';
                      const url = `${window.location.origin}/events/${slug}?access=${form.accessCode}`;
                      navigator.clipboard.writeText(url);
                      form.toast({ title: 'Skopiowano', description: 'Link do prywatnego wydarzenia został skopiowany do schowka.' });
                    }} title="Kopiuj link">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!form.isVirtual && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Lokalizacja (miejsce startu) *</Label>
                <Input id="location" value={form.location} onChange={e => form.setLocation(e.target.value)} placeholder="np. Stadion Narodowy" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Miasto *</Label>
                <Input id="city" value={form.city} onChange={e => form.setCity(e.target.value)} placeholder="np. Warszawa" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Opis wydarzenia</Label>
            <Textarea id="description" value={form.description} onChange={e => form.setDescription(e.target.value)} placeholder="Opisz szczegóły wydarzenia, trasę, atrakcje..." rows={4} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL obrazka</Label>
            <Input id="imageUrl" value={form.imageUrl} onChange={e => form.setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="featured" checked={form.featured} onCheckedChange={(checked) => form.setFeatured(checked === true)} />
            <Label htmlFor="featured" className="cursor-pointer">Wyróżnij wydarzenie na stronie głównej</Label>
          </div>

          {/* Media Section */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Media wydarzenia (opcjonalne)
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Baner wydarzenia</Label>
                <p className="text-sm text-muted-foreground">Pionowy obrazek w tle (zalecane 800x1200px)</p>
                <Input placeholder="URL banera" value={form.bannerUrl} onChange={(e) => form.setBannerUrl(e.target.value)} />
                {form.bannerUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={() => form.setShowBannerCropper(true)}>
                    <Crop className="h-4 w-4 mr-2" /> Przytnij baner
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <Label>Logo organizatora</Label>
                <p className="text-sm text-muted-foreground">Kwadratowe logo (zalecane 200x200px)</p>
                <Input placeholder="URL logo" value={form.organizerLogoUrl} onChange={(e) => form.setOrganizerLogoUrl(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Payment Configuration */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Konfiguracja płatności
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Wybierz sposób przyjmowania płatności od uczestników</p>
            <RadioGroup value={form.paymentConfigType} onValueChange={(value: PaymentConfigType) => form.setPaymentConfigType(value)} className="space-y-4">
              <div className={`relative flex items-start gap-3 p-4 rounded-lg border transition-colors ${form.paymentConfigType === 'admin_gateway' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}>
                <RadioGroupItem value="admin_gateway" id="admin_gateway" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="admin_gateway" className="flex items-center gap-2 cursor-pointer font-medium">
                    <CreditCard className="h-4 w-4 text-primary" /> Bramka płatnicza (automatyczna)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">Płatności są przetwarzane automatycznie przez bramkę płatniczą administratora serwisu.</p>
                </div>
              </div>
              <div className={`relative flex items-start gap-3 p-4 rounded-lg border transition-colors ${form.paymentConfigType === 'organizer_bank' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}>
                <RadioGroupItem value="organizer_bank" id="organizer_bank" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="organizer_bank" className="flex items-center gap-2 cursor-pointer font-medium">
                    <Building2 className="h-4 w-4 text-primary" /> Przelew bankowy (ręczny)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">Uczestnicy wpłacają na Twoje konto bankowe. Musisz ręcznie potwierdzać otrzymane wpłaty.</p>
                  {form.paymentConfigType === 'organizer_bank' && (
                    <div className="mt-4 pt-4 border-t border-dashed space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">Numer konta bankowego *</Label>
                        <Input id="bankAccountNumber" value={form.bankAccountNumber} onChange={(e) => form.setBankAccountNumber(e.target.value)} placeholder="PL 00 0000 0000 0000 0000 0000 0000" />
                        <p className="text-xs text-muted-foreground">Podaj pełny numer konta w formacie IBAN</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountHolder">Właściciel konta *</Label>
                        <Input id="bankAccountHolder" value={form.bankAccountHolder} onChange={(e) => form.setBankAccountHolder(e.target.value)} placeholder="Nazwa firmy lub Imię Nazwisko" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transferTitle">Wzór tytułu przelewu</Label>
                        <Input id="transferTitle" value={form.transferTitle} onChange={(e) => form.setTransferTitle(e.target.value)} placeholder="Opłata za {eventName} - {participantName}" />
                        <p className="text-xs text-muted-foreground">Dostępne zmienne: {'{eventName}'}, {'{participantName}'}, {'{distanceName}'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Rich Text Fields */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Dodatkowe informacje (opcjonalne)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Te pola pozwalają na formatowanie tekstu, dodawanie linków i list.</p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Organizatorzy</Label>
                <p className="text-sm text-muted-foreground">Możesz wpisać wielu organizatorów, sponsorów z linkami do ich stron.</p>
                <RichTextEditor value={form.organizersHtml} onChange={form.setOrganizersHtml} placeholder="Wpisz informacje o organizatorach..." minHeight="100px" />
              </div>
              <div className="space-y-2">
                <Label>Regulamin</Label>
                <p className="text-sm text-muted-foreground">Wpisz treść regulaminu lub dodaj linki do plików PDF.</p>
                <RichTextEditor value={form.rulesHtml} onChange={form.setRulesHtml} placeholder="Wpisz regulamin lub dodaj linki do dokumentów..." minHeight="120px" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox id="requireFinalAcceptance" checked={form.requireFinalAcceptance} onCheckedChange={(checked) => form.setRequireFinalAcceptance(checked === true)} />
                  <Label htmlFor="requireFinalAcceptance" className="cursor-pointer">Wymagaj dodatkowej akceptacji przy rejestracji</Label>
                </div>
                {form.requireFinalAcceptance && (
                  <div className="space-y-2 pl-6">
                    <Label>Tekst akceptacji</Label>
                    <p className="text-sm text-muted-foreground">Ten tekst pojawi się jako checkbox, który uczestnik musi zaakceptować przy rejestracji.</p>
                    <RichTextEditor value={form.finalAcceptanceHtml} onChange={form.setFinalAcceptanceHtml} placeholder="Oświadczam, że zapoznałem się z regulaminem..." minHeight="100px" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Embed Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" /> Zapisy przez iframe (embed)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Włącz widget do osadzenia</Label>
              <p className="text-sm text-muted-foreground">Partnerzy mogą umieścić formularz zapisów na swojej stronie</p>
            </div>
            <Switch checked={form.embedEnabled} onCheckedChange={form.setEmbedEnabled} />
          </div>
          {form.embedEnabled && (
            <div className="space-y-4 pt-2 border-t">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data rozpoczęcia (opcjonalnie)</Label>
                  <Input type="date" value={form.embedStartDate} onChange={e => form.setEmbedStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data zakończenia (opcjonalnie)</Label>
                  <Input type="date" value={form.embedEndDate} onChange={e => form.setEmbedEndDate(e.target.value)} />
                </div>
              </div>
              {form.name && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Kod do osadzenia:</Label>
                  <code className="text-xs block break-all">
                    {`<iframe src="${window.location.origin}/events/${form.generateSlug(form.name)}/embed" width="100%" height="800" frameborder="0"></iframe>`}
                  </code>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Form Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" /> Konfiguracja formularza rejestracji
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Wybierz, które pola będą widoczne w formularzu rejestracji dla uczestników.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { key: 'collectPhone' as const, label: 'Telefon kontaktowy' },
              { key: 'collectClub' as const, label: 'Klub / organizacja' },
              { key: 'collectBirthDate' as const, label: 'Data urodzenia' },
              { key: 'collectTeam' as const, label: 'Zapis drużynowy' },
              { key: 'collectInsurance' as const, label: 'Ubezpieczenie NNW' },
              { key: 'collectMerchandise' as const, label: 'Gadżety / merchandise' },
            ].map(field => (
              <label key={field.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-muted/50">
                <Checkbox
                  checked={form.formConfig[field.key]}
                  onCheckedChange={(checked) => form.setFormConfig({ ...form.formConfig, [field.key]: !!checked })}
                />
                <span className="text-sm">{field.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" /> Opcje wyświetlania listy uczestników
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Domyślne sortowanie</Label>
            <Select value={form.displayOptions.defaultSort} onValueChange={(v) => form.setDisplayOptions({ ...form.displayOptions, defaultSort: v as 'name' | 'bib' | 'date' | 'distance' })}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Po imieniu</SelectItem>
                <SelectItem value="bib">Po numerze startowym</SelectItem>
                <SelectItem value="date">Po dacie zapisu</SelectItem>
                <SelectItem value="distance">Po dystansie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={form.displayOptions.uppercaseNames} onCheckedChange={(checked) => form.setDisplayOptions({ ...form.displayOptions, uppercaseNames: !!checked })} />
            <span className="text-sm">Wymuś wielkie litery w nazwiskach (np. Jan KOWALSKI)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={form.displayOptions.hideUnpaid} onCheckedChange={(checked) => form.setDisplayOptions({ ...form.displayOptions, hideUnpaid: !!checked })} />
            <span className="text-sm">Ukryj nieopłaconych uczestników na liście publicznej</span>
          </label>
        </CardContent>
      </Card>

      {form.bannerUrl && (
        <ImageCropper
          imageUrl={form.bannerUrl}
          open={form.showBannerCropper}
          onOpenChange={form.setShowBannerCropper}
          aspectRatio={16 / 9}
          title="Przytnij baner wydarzenia"
          onCrop={(crop) => form.setBannerCropArea(crop)}
        />
      )}
    </>
  );
};
