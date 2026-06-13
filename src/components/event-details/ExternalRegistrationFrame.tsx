import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Event } from '@/types';
import { ExternalLink } from 'lucide-react';

interface ExternalRegistrationFrameProps {
  event: Event;
  active: boolean;
  closedReason?: string | null;
}

export const isExternalRegistrationEvent = (event: Event): boolean =>
  event.registrationEmbed?.mode === 'external_embed' && Boolean(event.registrationEmbed.externalUrl);

export const isExternalRegistrationActive = (event: Event): boolean => {
  if (!isExternalRegistrationEvent(event)) return false;
  const now = new Date();
  const startDate = event.registrationEmbed?.startDate;
  const endDate = event.registrationEmbed?.endDate;
  if (startDate && new Date(startDate) > now) return false;
  if (endDate && new Date(endDate) < now) return false;
  return true;
};

export const ExternalRegistrationFrame = ({
  event,
  active,
  closedReason,
}: ExternalRegistrationFrameProps) => {
  const externalUrl = event.registrationEmbed?.externalUrl;

  if (!externalUrl) return null;

  return (
    <section id="zapisy" className="scroll-mt-24">
      <Card className="overflow-hidden border-primary/20 shadow-sm">
        <div className="border-b bg-card px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Zapisy
              </p>
              <h2 className="text-xl font-semibold">Formularz zapisów</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Formularz pochodzi z zewnętrznego systemu organizatora.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Otwórz w nowej karcie
              </a>
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          {active ? (
            <iframe
              src={externalUrl}
              title={`Zapisy - ${event.name}`}
              className="h-[760px] w-full border-0 bg-background"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="flex min-h-[320px] items-center justify-center p-6 text-center">
              <div>
                <p className="text-lg font-semibold">Zapisy są niedostępne</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {closedReason || 'Zewnętrzny formularz zapisów nie jest teraz aktywny.'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
