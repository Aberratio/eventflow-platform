import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { disciplineLabels } from '@/api/mock/labels';
import { Event } from '@/types';
import { ArrowLeft, Globe } from 'lucide-react';

interface EventHeroBannerProps {
  event: Event;
  isPast: boolean;
  onBack: () => void;
}

export const EventHeroBanner = ({ event, isPast, onBack }: EventHeroBannerProps) => {
  const getBannerStyle = (): React.CSSProperties => {
    if (!event.bannerCropArea) return {};
    const { y, height } = event.bannerCropArea;
    return { objectPosition: `center ${y + height / 2}%` };
  };

  const badges = (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
      <Badge className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm text-xs sm:text-sm">
        <DisciplineIcon discipline={event.discipline} size="sm" className="text-current" />
        {disciplineLabels[event.discipline]}
      </Badge>
      {event.isVirtual && (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 backdrop-blur-sm text-xs sm:text-sm">
          <Globe className="h-3 w-3 mr-1" />
          Wirtualny
        </Badge>
      )}
      {isPast && <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs sm:text-sm">Zakończone</Badge>}
    </div>
  );

  if (event.bannerUrl) {
    return (
      <div className="relative h-56 sm:h-64 md:h-80 overflow-hidden bg-muted">
        <img
          src={event.bannerUrl}
          alt={event.name}
          className="absolute inset-0 w-full h-full object-cover"
          style={getBannerStyle()}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        {event.organizerLogoUrl && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6">
            <img
              src={event.organizerLogoUrl}
              alt={event.organizerName}
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg object-cover border-2 border-background shadow-lg"
            />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container pb-4 sm:pb-6">
            <Button variant="ghost" size="sm" className="mb-3 sm:mb-4 bg-background/20 backdrop-blur-sm hover:bg-background/40" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wróć
            </Button>
            {badges}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground drop-shadow-md">{event.name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Organizator: {event.organizerName}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 via-background to-warning/5 border-b">
      <div className="container py-5 sm:py-6">
        <Button variant="ghost" size="sm" className="mb-3 sm:mb-4" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Wróć
        </Button>
        {badges}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{event.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">Organizator: {event.organizerName}</p>
      </div>
    </div>
  );
};
