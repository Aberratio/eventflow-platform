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
    <div className="mb-2 flex flex-wrap gap-1.5 sm:mb-3 sm:gap-2">
      <Badge className="flex items-center gap-1.5 bg-background/80 text-xs backdrop-blur-sm sm:text-sm">
        <DisciplineIcon discipline={event.discipline} size="sm" className="text-current" />
        {disciplineLabels[event.discipline]}
      </Badge>
      {event.isVirtual && (
        <Badge
          variant="outline"
          className="border-primary/30 bg-primary/10 text-xs text-primary backdrop-blur-sm sm:text-sm"
        >
          <Globe className="mr-1 h-3 w-3" />
          Wirtualny
        </Badge>
      )}
      {isPast && (
        <Badge variant="secondary" className="bg-background/80 text-xs backdrop-blur-sm sm:text-sm">
          Zakończone
        </Badge>
      )}
    </div>
  );

  if (heroImageUrl) {
    return (
      <div className="relative h-56 overflow-hidden bg-muted sm:h-64 md:h-80">
        <img
          src={heroImageUrl}
          alt={event.name}
          className="absolute inset-0 h-full w-full object-cover"
          style={getBannerStyle()}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        {event.organizerLogoUrl && (
          <div className="absolute right-3 top-3 sm:right-4 sm:top-4 md:right-6 md:top-6">
            <img
              src={event.organizerLogoUrl}
              alt={event.organizerName}
              className={getOrganizerLogoClassName(event.organizerLogoShape)}
            />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container pb-4 sm:pb-6">
            <Button
              variant="ghost"
              size="sm"
              className="mb-3 bg-background/20 backdrop-blur-sm hover:bg-background/40 sm:mb-4"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wróć
            </Button>
            {badges}
            <h1 className="text-2xl font-bold text-foreground drop-shadow-md sm:text-3xl md:text-4xl">
              {event.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Organizator: {event.organizerName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageHero>
      <Button variant="ghost" size="sm" className="mb-3 sm:mb-4" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Wróć
      </Button>
      {badges}
      <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">{event.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Organizator: {event.organizerName}</p>
    </PageHero>
  );
};
