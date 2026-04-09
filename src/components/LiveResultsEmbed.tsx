import { Card, CardContent } from '@/components/ui/card';
import { Radio } from 'lucide-react';

interface LiveResultsEmbedProps {
  url?: string;
  eventName: string;
}

export const LiveResultsEmbed = ({ url, eventName }: LiveResultsEmbedProps) => {
  if (!url) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-12 text-center">
            <Radio className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Wyniki na żywo będą dostępne wkrótce.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative">
            <Radio className="h-5 w-5 text-destructive" />
            <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-destructive" />
          </div>
          <span className="font-semibold text-destructive">LIVE</span>
          <span className="text-muted-foreground">- Wyniki na żywo</span>
        </div>
        <div className="overflow-hidden rounded-lg bg-muted">
          {/* Placeholder for iframe - in production this would be an actual iframe */}
          <div className="flex aspect-video items-center justify-center border-2 border-dashed border-muted-foreground/20 bg-muted">
            <div className="p-4 text-center">
              <Radio className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="font-medium">Wyniki na żywo: {eventName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                (Mock - w produkcji tutaj będzie iframe z: {url})
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
