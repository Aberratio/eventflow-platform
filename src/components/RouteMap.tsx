import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Maximize2, X, Map, TrendingUp } from 'lucide-react';

interface RouteMapProps {
  mapUrl: string;
  elevationProfileUrl?: string;
  gpxUrl?: string;
  distanceInfo?: {
    length: number;
    unit: string;
    elevation?: string;
  };
}

export const RouteMap = ({ mapUrl, elevationProfileUrl, gpxUrl, distanceInfo }: RouteMapProps) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isElevationOpen, setIsElevationOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Main map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Map className="h-5 w-5 text-primary" />
            Mapa trasy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={() => setIsMapOpen(true)}
            className="group relative w-full overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <img
              src={mapUrl}
              alt="Mapa trasy"
              className="h-auto max-h-[400px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
              <div className="rounded-full bg-background/90 p-3 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-6 w-6 text-foreground" />
              </div>
            </div>
          </button>

          {distanceInfo && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {distanceInfo.length != null && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Długość:</span>
                  <span className="font-semibold">
                    {distanceInfo.length} {distanceInfo.unit}
                  </span>
                </div>
              )}
              {distanceInfo.elevation && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Przewyższenie:</span>
                  <span className="font-semibold">{distanceInfo.elevation}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Elevation profile */}
      {elevationProfileUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Profil wysokościowy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => setIsElevationOpen(true)}
              className="group relative w-full overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <img
                src={elevationProfileUrl}
                alt="Profil wysokościowy"
                className="h-auto max-h-[200px] w-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                <div className="rounded-full bg-background/90 p-2 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-5 w-5 text-foreground" />
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      )}

      {/* GPX download button */}
      {gpxUrl && (
        <Button variant="outline" className="w-full" asChild>
          <a href={gpxUrl} download>
            <Download className="mr-2 h-4 w-4" />
            Pobierz plik GPX
          </a>
        </Button>
      )}

      {/* Map dialog */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="w-full max-w-5xl border bg-background p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-50"
              onClick={() => setIsMapOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <img
              src={mapUrl}
              alt="Mapa trasy - pełny rozmiar"
              className="h-auto max-h-[85vh] w-full object-contain p-4"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Elevation dialog */}
      {elevationProfileUrl && (
        <Dialog open={isElevationOpen} onOpenChange={setIsElevationOpen}>
          <DialogContent className="w-full max-w-4xl border bg-background p-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-50"
                onClick={() => setIsElevationOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              <img
                src={elevationProfileUrl}
                alt="Profil wysokościowy - pełny rozmiar"
                className="h-auto max-h-[60vh] w-full object-contain p-4"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
