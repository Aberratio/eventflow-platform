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
              className="w-full h-auto max-h-[400px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="bg-background/90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Maximize2 className="h-6 w-6 text-foreground" />
              </div>
            </div>
          </button>

          {distanceInfo && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Długość:</span>
                <span className="font-semibold">{distanceInfo.length} {distanceInfo.unit}</span>
              </div>
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
                className="w-full h-auto max-h-[200px] object-contain"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="bg-background/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
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
            <Download className="h-4 w-4 mr-2" />
            Pobierz plik GPX
          </a>
        </Button>
      )}

      {/* Map dialog */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-5xl w-full p-0 bg-background border">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-50"
              onClick={() => setIsMapOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <img
              src={mapUrl}
              alt="Mapa trasy - pełny rozmiar"
              className="w-full h-auto max-h-[85vh] object-contain p-4"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Elevation dialog */}
      {elevationProfileUrl && (
        <Dialog open={isElevationOpen} onOpenChange={setIsElevationOpen}>
          <DialogContent className="max-w-4xl w-full p-0 bg-background border">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-50"
                onClick={() => setIsElevationOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              <img
                src={elevationProfileUrl}
                alt="Profil wysokościowy - pełny rozmiar"
                className="w-full h-auto max-h-[60vh] object-contain p-4"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
