import { useAuth } from '@/contexts/AuthContext';
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
  Plus,
  Trash2,
  Info,
  Users,
  Link2,
} from 'lucide-react';
import type { EventFormState } from '../hooks/useEventFormState';

interface EventFormOrganizerSectionProps {
  form: EventFormState;
}

export const EventFormOrganizerSection = ({ form }: EventFormOrganizerSectionProps) => {
  const { user } = useAuth();

  const handlePrefillFromProfile = () => {
    const email = user?.email || '';
    const phone = user?.phone || '';
    if (form.organizerContacts.length === 0) {
      form.addOrganizerContact();
      const id = `contact-${Date.now()}`;
      // We add one and update immediately via state setter
      form.setOrganizerContacts([{ id, email, phone: phone || undefined }]);
    } else {
      const first = form.organizerContacts[0];
      form.updateOrganizerContact(first.id, {
        email: email || first.email,
        phone: phone || first.phone,
      });
    }
  };

  const hasContactsFromProfile = user?.email || user?.phone;

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
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{form.organizers.find((o) => o.id === form.selectedOrganizerId)?.companyName || form.organizers.find((o) => o.id === form.selectedOrganizerId)?.name || user?.companyName || user?.name || '—'}</p>
            {(user?.website || form.organizers.find((o) => o.id === form.selectedOrganizerId)?.website) && (
              <a
                href={user?.website || form.organizers.find((o) => o.id === form.selectedOrganizerId)?.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {(user?.website || form.organizers.find((o) => o.id === form.selectedOrganizerId)?.website)?.replace('https://', '')}
              </a>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Nazwa i strona organizatora pobierana jest automatycznie z profilu. Aby je zmienić, zaktualizuj{' '}
            <a href="/organizer/settings" className="text-primary underline-offset-4 hover:underline" target="_blank">
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
            Dodaj adresy e-mail i numery telefonu, pod którymi uczestnicy mogą się skontaktować z organizatorem.
            Możesz dodać kilka wpisów.
          </p>

          {hasContactsFromProfile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrefillFromProfile}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Wczytaj dane z profilu
            </Button>
          )}

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
                  <span className="text-xs font-medium text-muted-foreground">
                    Wpis {idx + 1}
                  </span>
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
                <div className="grid gap-3 sm:grid-cols-2">
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
              Dane kontaktowe wpisane tutaj dotyczą tylko tego wydarzenia. Jeśli chcesz, aby były dostępne przy każdym nowym wydarzeniu, warto je uzupełnić w{' '}
              <a href="/organizer/settings" className="text-primary underline-offset-4 hover:underline" target="_blank">
                profilu organizatora
              </a>
              .
            </AlertDescription>
          </Alert>
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
            Dodaj sponsorów i partnerów wydarzenia. Możesz podać nazwę, link do strony i logo.
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
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Nazwa sponsora <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={sponsor.name}
                      onChange={(e) =>
                        form.updateSponsor(sponsor.id, { name: e.target.value })
                      }
                      placeholder="np. FirmaSportowa S.A."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Globe className="h-3.5 w-3.5" /> Strona www
                      </Label>
                      <Input
                        type="url"
                        value={sponsor.url || ''}
                        onChange={(e) =>
                          form.updateSponsor(sponsor.id, { url: e.target.value })
                        }
                        placeholder="https://sponsor.pl"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <HelpLabel description="Podaj bezpośredni link do pliku graficznego z logo sponsora (np. PNG, SVG). Logo będzie wyświetlone na stronie wydarzenia.">
                        <span className="text-xs">Logo (URL)</span>
                      </HelpLabel>
                      <Input
                        type="url"
                        value={sponsor.logoUrl || ''}
                        onChange={(e) =>
                          form.updateSponsor(sponsor.id, { logoUrl: e.target.value })
                        }
                        placeholder="https://sponsor.pl/logo.png"
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
