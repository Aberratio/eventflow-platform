import { Button } from '@/components/ui/button';
import { Radio, ExternalLink, ArrowRight } from 'lucide-react';
import { Event } from '@/types';
import { Link } from 'react-router-dom';

interface LiveResultsBannerProps {
  events: Event[];
}

export const LiveResultsBanner = ({ events }: LiveResultsBannerProps) => {
  const liveEvents = events.filter(e => !e.isPrivate && e.isLive && e.liveResultsUrl);

  if (liveEvents.length === 0) return null;

  const firstLive = liveEvents[0];

  return (
    <section className="py-4">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-lg border border-destructive/20 bg-destructive/5 p-4 md:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Radio className="h-6 w-6 text-destructive" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-destructive rounded-full animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-destructive text-sm">LIVE</span>
                  <span className="text-sm font-medium">
                    {liveEvents.length === 1
                      ? firstLive.name
                      : `${liveEvents.length} zawody na żywo`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Śledź wyniki w czasie rzeczywistym
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {liveEvents.length === 1 && firstLive.liveResultsUrl ? (
                <Button size="sm" asChild>
                  <a href={firstLive.liveResultsUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                    Zobacz wyniki LIVE
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <Link to="/wyniki/live" className="gap-1.5">
                    Zobacz transmisje
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
