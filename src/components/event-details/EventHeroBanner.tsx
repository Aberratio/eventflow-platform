import { disciplineLabels } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { Event, OrganizerLogoShape } from '@/types';
import { ArrowLeft, Globe } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';

interface EventHeroBannerProps {
  event: Event;
  isPast: boolean;
  onBack: () => void;
}

const getOrganizerLogoClassName = (shape: OrganizerLogoShape = 'square') => {
  const base =
    'rounded-lg border-2 border-background bg-background/90 object-contain p-1 shadow-lg';

  switch (shape) {
    case 'landscape':
      return `${base} h-11 w-20 sm:h-14 sm:w-28 md:h-16 md:w-32`;
    case 'portrait':
      return `${base} h-16 w-12 sm:h-20 sm:w-[3.75rem] md:h-24 md:w-[4.5rem]`;
    case 'square':
    default:
      return `${base} h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20`;
  }
};

export const EventHeroBanner = ({ event, isPast, onBack }: EventHeroBannerProps) => {
  const heroImageUrl = event.bannerUrl || event.imageUrl;

  const getBannerStyle = (): React.CSSProperties => {
    if (!event.bannerUrl || !event.bannerCropArea) return {};
    const { y, height } = event.bannerCropArea;
    return { objectPosition: `center ${y + height / 2}%` };
  };

  const badges = (
    <div className="mb-4 flex flex-wrap gap-1.5 sm:mb-5 sm:gap-2">
      <Badge className="flex items-center gap-1.5 rounded-md border border-primary/60 bg-background/70 px-3 py-1.5 text-xs text-foreground shadow-[0_0_20px_rgba(38,116,217,0.18)] backdrop-blur-md sm:text-sm">
        <DisciplineIcon discipline={event.discipline} size="sm" className="text-current" />
        {disciplineLabels[event.discipline]}
      </Badge>
      {event.isVirtual && (
        <Badge
          variant="outline"
          className="rounded-md border-primary/50 bg-primary/10 px-3 py-1.5 text-xs text-primary backdrop-blur-md sm:text-sm"
        >
          <Globe className="mr-1 h-3 w-3" />
          Wirtualny
        </Badge>
      )}
      {isPast && (
        <Badge
          variant="secondary"
          className="rounded-md bg-background/70 px-3 py-1.5 text-xs backdrop-blur-md sm:text-sm"
        >
          Zakończone
        </Badge>
      )}
    </div>
  );

  if (heroImageUrl) {
    return (
      <div className="relative min-h-[420px] overflow-hidden bg-[#05080d] sm:min-h-[480px] md:min-h-[540px]">
        <img
          src={heroImageUrl}
          alt={event.name}
          className="absolute inset-0 h-full w-full object-cover"
          style={getBannerStyle()}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,12,0.96)_0%,rgba(3,7,12,0.72)_38%,rgba(3,7,12,0.24)_72%),linear-gradient(180deg,rgba(3,7,12,0.24)_0%,rgba(3,7,12,0.48)_42%,hsl(var(--background))_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
        {event.organizerLogoUrl && (
          <div className="absolute right-3 top-3 sm:right-4 sm:top-4 md:right-6 md:top-6">
            <img
              src={event.organizerLogoUrl}
              alt={event.organizerName}
              className={getOrganizerLogoClassName(event.organizerLogoShape)}
            />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 top-0 flex items-end">
          <div className="container pb-32 sm:pb-36">
            <Button
              variant="outline"
              size="sm"
              className="mb-8 border-white/15 bg-white/[0.04] text-foreground backdrop-blur-md hover:bg-white/[0.09] sm:mb-9"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wróć
            </Button>
            {badges}
            <h1 className="max-w-4xl text-3xl font-bold text-foreground drop-shadow-2xl sm:text-4xl md:text-5xl">
              {event.name}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Organizator: {event.organizerName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageHero className="min-h-[420px] bg-[radial-gradient(circle_at_70%_20%,rgba(38,116,217,0.2),transparent_34%),linear-gradient(180deg,#0b1119,#05080d)]">
      <Button
        variant="outline"
        size="sm"
        className="mb-8 border-white/15 bg-white/[0.04] text-foreground backdrop-blur-md hover:bg-white/[0.09]"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Wróć
      </Button>
      {badges}
      <h1 className="max-w-4xl text-3xl font-bold sm:text-4xl md:text-5xl">{event.name}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Organizator: {event.organizerName}</p>
    </PageHero>
  );
};
