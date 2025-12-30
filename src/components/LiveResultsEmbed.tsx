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
          <div className="text-center py-12">
            <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Wyniki na żywo będą dostępne wkrótce.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative">
            <Radio className="h-5 w-5 text-destructive" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
          </div>
          <span className="font-semibold text-destructive">LIVE</span>
          <span className="text-muted-foreground">- Wyniki na żywo</span>
        </div>
        <div className="bg-muted rounded-lg overflow-hidden">
          {/* Placeholder for iframe - in production this would be an actual iframe */}
          <div className="aspect-video flex items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/20">
            <div className="text-center p-4">
              <Radio className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">Wyniki na żywo: {eventName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                (Mock - w produkcji tutaj będzie iframe z: {url})
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
