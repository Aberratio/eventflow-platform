import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { updateEvent } from '@/api';
import type { Event } from '@/types';
import { Code2, Copy, Plus, X } from 'lucide-react';

interface EventEmbedSettingsCardProps {
  event: Event;
}

// Mirrors the server's validation regex (routes.php PATCH /events/{id}):
// a bare http(s) scheme+host[:port] origin, no path/query/fragment. Kept in
// sync manually — this is a client-side convenience check only, the server
// is the source of truth and still rejects anything this misses.
const ORIGIN_PATTERN = /^https?:\/\/[^/\s?#]+$/i;

/**
 * Lets the organizer (or admin)
 * enable embedding this event's registration form on their own external
 * site, configure the origin allowlist the embed page checks before
 * rendering, and copy a ready-made `<iframe>` snippet.
 */
export const EventEmbedSettingsCard = ({ event }: EventEmbedSettingsCardProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [embedEnabled, setEmbedEnabled] = useState(event.embedEnabled ?? false);
  const [origins, setOrigins] = useState<string[]>(event.embedAllowedOrigins ?? []);
  const [newOrigin, setNewOrigin] = useState('');
  const [originError, setOriginError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEmbedEnabled(event.embedEnabled ?? false);
    setOrigins(event.embedAllowedOrigins ?? []);
  }, [event.embedEnabled, event.embedAllowedOrigins]);

  const embedUrl = `${window.location.origin}/embed/event/${event.id}/register`;
  const embedSnippet = `<iframe src="${embedUrl}" width="100%" height="900" style="border:0"></iframe>`;

  const addOrigin = () => {
    const trimmed = newOrigin.trim();
    if (!trimmed) return;
    if (!ORIGIN_PATTERN.test(trimmed)) {
      setOriginError('Podaj sam adres, np. https://przyklad.pl (bez ścieżki, bez /).');
      return;
    }
    if (origins.some((o) => o.toLowerCase() === trimmed.toLowerCase())) {
      setOriginError('Ten adres jest już na liście.');
      return;
    }
    setOrigins((prev) => [...prev, trimmed]);
    setNewOrigin('');
    setOriginError(null);
  };

  const removeOrigin = (origin: string) => {
    setOrigins((prev) => prev.filter((o) => o !== origin));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await updateEvent(event.id, {
        embedEnabled,
        embedAllowedOrigins: origins,
      });
      if (!response.success) {
        throw new Error(response.message || 'Nie udało się zapisać ustawień osadzania.');
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['event', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['organizer-events', event.organizerId] }),
      ]);
      toast({
        title: 'Zapisano ustawienia osadzania',
        description: embedEnabled
          ? 'Formularz można teraz osadzić w dozwolonych witrynach.'
          : 'Osadzanie formularza jest wyłączone.',
      });
    } catch (error) {
      // Surfaces the server's 422 validation_error message the same way
      // every other handler in EventSettingsTab does — the adapter's
      // apiErrorMessage() already turns the {error:{code,message}} shape
      // into a plain Error, so any edge case the client-side ORIGIN_PATTERN
      // check missed still shows up here.
      toast({
        title: 'Nie udało się zapisać ustawień osadzania',
        description: error instanceof Error ? error.message : 'Spróbuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(embedSnippet);
    toast({ title: 'Skopiowano', description: 'Fragment iframe skopiowany do schowka.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          Embed / iframe
        </CardTitle>
        <CardDescription>
          Pozwól osadzić ten formularz zapisów na zewnętrznej stronie organizatora przez{' '}
          <code>&lt;iframe&gt;</code>. Prawdziwe wymuszenie ograniczenia (nagłówek{' '}
          <code>frame-ancestors</code>) zależy od warstwy hostingu i nie jest gwarantowane przez
          samą listę poniżej — traktuj ją jako dodatkowe zabezpieczenie, nie jedyne.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <Label htmlFor="embed-enabled-toggle" className="cursor-pointer">
            Udostępnij formularz do osadzenia
          </Label>
          <Switch
            id="embed-enabled-toggle"
            checked={embedEnabled}
            onCheckedChange={setEmbedEnabled}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label>Dozwolone adresy (origin)</Label>
          <p className="text-xs text-muted-foreground">
            Puste = brak ograniczenia (formularz można osadzić wszędzie, gdy udostępniony powyżej).
          </p>
          <div className="flex flex-wrap gap-2">
            {origins.length === 0 && (
              <p className="text-sm text-muted-foreground">Brak skonfigurowanych adresów.</p>
            )}
            {origins.map((origin) => (
              <Badge key={origin} variant="secondary" className="flex items-center gap-1 pr-1">
                {origin}
                <button
                  type="button"
                  aria-label={`Usuń ${origin}`}
                  onClick={() => removeOrigin(origin)}
                  disabled={isSaving}
                  className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="https://przyklad.pl"
              value={newOrigin}
              onChange={(e) => {
                setNewOrigin(e.target.value);
                setOriginError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addOrigin();
                }
              }}
              disabled={isSaving}
            />
            <Button type="button" variant="outline" onClick={addOrigin} disabled={isSaving}>
              <Plus className="mr-1 h-4 w-4" /> Dodaj
            </Button>
          </div>
          {originError && <p className="text-sm text-destructive">{originError}</p>}
        </div>

        <div className="space-y-2 border-t pt-4">
          <Label>Fragment do wklejenia</Label>
          <div className="flex gap-2">
            <Input value={embedSnippet} readOnly className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copySnippet}
              title="Kopiuj fragment"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Zapisywanie...' : 'Zapisz ustawienia osadzania'}
        </Button>
      </CardContent>
    </Card>
  );
};
