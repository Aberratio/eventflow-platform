import { DateInput, TimeInput } from '@/components/ui/date-time-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { HelpLabel } from '@/components/ui/field-help';
import { DEFAULT_SELF_SERVICE_LEAD_DAYS } from '@/lib/selfService';

interface EventSelfServiceSectionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  /** `YYYY-MM-DDTHH:mm` in local time, '' = the default (7 days before the start). */
  deadline: string;
  onDeadlineChange: (deadline: string) => void;
  /** The event's start date (`YYYY-MM-DD`), for the hint about the default cut-off. */
  eventDate: string;
}

const defaultDeadlineHint = (eventDate: string): string | null => {
  const [year, month, day] = eventDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day - DEFAULT_SELF_SERVICE_LEAD_DAYS);
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * „Samoobsługa zapisów”. One switch and one
 * cut-off date per Wydarzenie; today it governs the participant's own cancellation, and later
 * self-service changes (dystans) share the same date. Organizers can always act themselves.
 */
export const EventSelfServiceSection = ({
  enabled,
  onEnabledChange,
  deadline,
  onDeadlineChange,
  eventDate,
}: EventSelfServiceSectionProps) => {
  const [datePart = '', timePart = ''] = deadline ? deadline.split('T') : [];
  const hint = defaultDeadlineHint(eventDate);

  const changeDate = (value: string) => {
    onDeadlineChange(value ? `${value}T${timePart || '23:59'}` : '');
  };
  const changeTime = (value: string) => {
    if (datePart) onDeadlineChange(`${datePart}T${value || '23:59'}`);
  };

  return (
    <div className="space-y-3 rounded-md border bg-white/[0.025] p-3">
      <HelpLabel description="Pozwala zawodnikom samodzielnie zrezygnować z zapisu z poziomu swojego panelu, do wskazanej daty. Opłacona rezygnacja tworzy wniosek o zwrot, który rozpatrujesz zgodnie z zasadami wydarzenia. Ty zawsze możesz usunąć uczestnika sam.">
        Samoobsługa zapisów
      </HelpLabel>

      <div className="flex items-center gap-2">
        <Switch
          id="self-service-enabled"
          checked={enabled}
          onCheckedChange={onEnabledChange}
          aria-label="Zawodnik może sam zrezygnować z zapisu"
        />
        <Label htmlFor="self-service-enabled" className="cursor-pointer text-sm">
          Zawodnik może sam zrezygnować z zapisu
        </Label>
      </div>

      {enabled && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="self-service-deadline-date" className="text-sm text-muted-foreground">
              Data graniczna rezygnacji
            </Label>
            <DateInput
              id="self-service-deadline-date"
              value={datePart}
              onValueChange={changeDate}
              placeholder={hint ? `Domyślnie ${hint}` : 'Domyślnie 7 dni przed startem'}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="self-service-deadline-time" className="text-sm text-muted-foreground">
              Godzina graniczna
            </Label>
            <TimeInput
              id="self-service-deadline-time"
              value={timePart}
              onValueChange={changeTime}
              disabled={!datePart}
            />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            {datePart
              ? 'Po tej dacie zawodnik nie zrezygnuje samodzielnie — zostaje kontakt z Tobą.'
              : `Bez własnej daty rezygnacja jest możliwa do ${DEFAULT_SELF_SERVICE_LEAD_DAYS} dni przed startem${hint ? ` (${hint})` : ''}.`}
          </p>
        </div>
      )}
    </div>
  );
};
