import { safeUrl } from '@/lib/safeUrl';
import { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadEventImage } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpLabel } from '@/components/ui/field-help';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Plus,
  Trash2,
  Info,
  Link2,
  Users,
  Upload,
  Loader2,
  X,
} from 'lucide-react';
import type { EventFormState } from '../hooks/useEventFormState';

interface EventFormOrganizerSectionProps {
  form: EventFormState;
}

const SponsorLogoUpload = ({
  sponsorId,
  logoUrl,
  onUpload,
  onRemove,
  toast,
}: {
  sponsorId: string;
  logoUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  toast: EventFormState['toast'];
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const response = await uploadEventImage(file);
      onUpload(response.data.url);
    } catch (error) {
      toast({
        title: 'Błąd uploadu',
        description:
          error instanceof Error ? error.message : 'Nie udało się wgrać logo. Spróbuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (logoUrl) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-border/60 bg-muted/30 p-1">
          <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
        </div>
        <Button
          aria-label="Usuń logo"
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? 'Wgrywanie…' : 'Wgraj logo'}
      </Button>
    </>
  );
};

const CoOrganizerLogoUpload = ({
  logoUrl,
  onUpload,
  onRemove,
  toast,
}: {
  logoUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  toast: EventFormState['toast'];
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const response = await uploadEventImage(file);
      onUpload(response.data.url);
    } catch (error) {
      toast({
        title: 'Błąd uploadu',
        description:
          error instanceof Error ? error.message : 'Nie udało się wgrać logo. Spróbuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (logoUrl) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-border/60 bg-muted/30 p-1">
          <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
        </div>
        <Button
          aria-label="Usuń logo"
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? 'Wgrywanie…' : 'Wgraj logo'}
      </Button>
    </>
  );
};

export const EventFormOrganizerSection = ({ form }: EventFormOrganizerSectionProps) => {
  const { user } = useAuth();

  const selectedOrganizer = form.organizers.find((o) => o.id === form.selectedOrganizerId);
  const organizerName =
    selectedOrganizer?.companyName ||
    selectedOrganizer?.name ||
    user?.companyName ||
    user?.name ||
    '—';
  const organizerWebsite = selectedOrganizer?.website || user?.website;

  return (
    <div className="space-y-6">
      {/* Organizer info from profile */}
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Dane organizatora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">{organizerName}</p>
            {organizerWebsite &&
              (safeUrl(organizerWebsite) ? (
                <a
                  href={safeUrl(organizerWebsite)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {organizerWebsite.replace('https://', '')}
                </a>
              ) : (
                <span className="mt-1 flex items-center gap-1 text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  {organizerWebsite}
                </span>
              ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Nazwa i strona organizatora pobierana jest automatycznie z profilu. Aby je zmienić,
            zaktualizuj{' '}
            <a
              href="/profile"
              className="text-primary underline-offset-4 hover:underline"
              target="_blank"
            >
              dane profilu
            </a>
            .
          </p>
        </CardContent>
      </Card>

      {/* Contact entries */}
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Kontakt do organizatora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-sm text-muted-foreground">
            Adresy e-mail i numery telefonu, pod którymi uczestnicy mogą się skontaktować. Możesz
            dodać kilka wpisów, np. osobny kontakt dla każdej osoby z organizacji.
          </p>

          {form.organizerContacts.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              Brak wpisów kontaktowych. Dodaj przynajmniej jeden.
            </div>
          )}

          <div className="space-y-3">
            {form.organizerContacts.map((contact, idx) => (
              <div
                key={contact.id}
                className="relative rounded-lg border border-border/60 bg-card p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Wpis {idx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => form.removeOrganizerContact(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nazwa / osoba kontaktowa</Label>
                    <Input
                      value={contact.name || ''}
                      onChange={(e) =>
                        form.updateOrganizerContact(contact.id, { name: e.target.value })
                      }
                      placeholder="np. Biuro organizatora"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Mail className="h-3.5 w-3.5" /> E-mail
                      </Label>
                      <Input
                        type="email"
                        value={contact.email || ''}
                        onChange={(e) =>
                          form.updateOrganizerContact(contact.id, { email: e.target.value })
                        }
                        placeholder="kontakt@example.com"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Phone className="h-3.5 w-3.5" /> Telefon
                      </Label>
                      <Input
                        type="tel"
                        value={contact.phone || ''}
                        onChange={(e) =>
                          form.updateOrganizerContact(contact.id, { phone: e.target.value })
                        }
                        placeholder="+48 123 456 789"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={form.addOrganizerContact}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Dodaj wpis kontaktowy
          </Button>

          <Alert className="border-blue-200/40 bg-blue-500/5">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-xs text-muted-foreground">
              Dane kontaktowe wpisane tutaj dotyczą tylko tego wydarzenia. Jeśli chcesz, aby były
              dostępne przy każdym nowym wydarzeniu, warto je uzupełnić w{' '}
              <a
                href="/profile"
                className="text-primary underline-offset-4 hover:underline"
                target="_blank"
              >
                profilu organizatora
              </a>
              .
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Co-organizers */}
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Współorganizatorzy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-sm text-muted-foreground">
            Dodaj współorganizatorów wydarzenia. Podaj nazwę (wymagana) oraz opcjonalnie dane
            kontaktowe i logo.
          </p>

          {form.coOrganizers.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              Brak współorganizatorów. Dodaj pierwszego poniżej.
            </div>
          )}

          <div className="space-y-3">
            {form.coOrganizers.map((coOrg, idx) => (
              <div
                key={coOrg.id}
                className="relative rounded-lg border border-border/60 bg-card p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Współorganizator {idx + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => form.removeCoOrganizer(coOrg.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Nazwa współorganizatora <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={coOrg.name}
                      onChange={(e) => form.updateCoOrganizer(coOrg.id, { name: e.target.value })}
                      placeholder="np. Klub Sportowy XYZ"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Mail className="h-3.5 w-3.5" /> E-mail
                      </Label>
                      <Input
                        type="email"
                        value={coOrg.email || ''}
                        onChange={(e) =>
                          form.updateCoOrganizer(coOrg.id, { email: e.target.value })
                        }
                        placeholder="kontakt@example.com"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Phone className="h-3.5 w-3.5" /> Telefon
                      </Label>
                      <Input
                        type="tel"
                        value={coOrg.phone || ''}
                        onChange={(e) =>
                          form.updateCoOrganizer(coOrg.id, { phone: e.target.value })
                        }
                        placeholder="+48 123 456 789"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <MapPin className="h-3.5 w-3.5" /> Adres
                    </Label>
                    <Input
                      value={coOrg.address || ''}
                      onChange={(e) =>
                        form.updateCoOrganizer(coOrg.id, { address: e.target.value })
                      }
                      placeholder="ul. Sportowa 1, 00-001 Warszawa"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <HelpLabel description="Logo wyświetlane obok nazwy współorganizatora. Zalecany format: PNG lub SVG z przezroczystym tłem.">
                      Logo
                    </HelpLabel>
                    <CoOrganizerLogoUpload
                      logoUrl={coOrg.logoUrl}
                      onUpload={(url) => form.updateCoOrganizer(coOrg.id, { logoUrl: url })}
                      onRemove={() => form.updateCoOrganizer(coOrg.id, { logoUrl: undefined })}
                      toast={form.toast}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={form.addCoOrganizer}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Dodaj współorganizatora
          </Button>
        </CardContent>
      </Card>

      {/* Sponsors */}
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6">
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" /> Sponsorzy i partnerzy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-sm text-muted-foreground">
            Dodaj sponsorów i partnerów wydarzenia. Możesz podać nazwę, link do strony i wgrać logo.
          </p>

          {form.sponsors.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              Brak sponsorów. Dodaj pierwszego poniżej.
            </div>
          )}

          <div className="space-y-3">
            {form.sponsors.map((sponsor, idx) => (
              <div
                key={sponsor.id}
                className="relative rounded-lg border border-border/60 bg-card p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Sponsor {idx + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => form.removeSponsor(sponsor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Nazwa sponsora <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={sponsor.name}
                        onChange={(e) => form.updateSponsor(sponsor.id, { name: e.target.value })}
                        placeholder="np. FirmaSportowa S.A."
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Globe className="h-3.5 w-3.5" /> Strona www
                      </Label>
                      <Input
                        type="url"
                        value={sponsor.url || ''}
                        onChange={(e) => form.updateSponsor(sponsor.id, { url: e.target.value })}
                        placeholder="https://sponsor.pl"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <HelpLabel description="Logo wyświetlane obok nazwy sponsora na stronie wydarzenia. Zalecany format: PNG lub SVG z przezroczystym tłem.">
                      Logo
                    </HelpLabel>
                    <SponsorLogoUpload
                      sponsorId={sponsor.id}
                      logoUrl={sponsor.logoUrl}
                      onUpload={(url) => form.updateSponsor(sponsor.id, { logoUrl: url })}
                      onRemove={() => form.updateSponsor(sponsor.id, { logoUrl: undefined })}
                      toast={form.toast}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={form.addSponsor}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Dodaj sponsora / partnera
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
