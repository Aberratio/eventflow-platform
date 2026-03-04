import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Distance } from '@/types';
import { Map, Download, Mountain, Image, FileText } from 'lucide-react';

interface DistanceRouteDialogProps {
  distance: Distance;
  trigger?: React.ReactNode;
}

const fileTypeLabels: Record<string, string> = {
  map: 'Mapa',
  elevation: 'Profil',
  gpx: 'GPX',
  image: 'Zdjęcie',
};

const fileTypeIcons: Record<string, React.ReactNode> = {
  map: <Map className="h-4 w-4" />,
  elevation: <Mountain className="h-4 w-4" />,
  gpx: <FileText className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
};

export const hasRouteArtifacts = (distance: Distance): boolean => {
  return !!(distance.routeMapUrl || distance.routeElevationProfile || distance.routeGpxUrl || (distance.routeFiles && distance.routeFiles.length > 0));
};

export const DistanceRouteDialog = ({ distance, trigger }: DistanceRouteDialogProps) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!hasRouteArtifacts(distance)) return null;

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-1.5">
              <Map className="h-3.5 w-3.5" />
              Zobacz trasę
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Trasa — {distance.name} ({distance.length} {distance.unit})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {distance.routeMapUrl && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Map className="h-4 w-4 text-primary" /> Mapa trasy
                </h4>
                <img
                  src={distance.routeMapUrl}
                  alt={`Mapa trasy ${distance.name}`}
                  className="w-full rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setPreviewImage(distance.routeMapUrl!)}
                />
              </div>
            )}

            {distance.routeElevationProfile && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-primary" /> Profil przewyższeń
                </h4>
                <img
                  src={distance.routeElevationProfile}
                  alt={`Profil przewyższeń ${distance.name}`}
                  className="w-full rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setPreviewImage(distance.routeElevationProfile!)}
                />
              </div>
            )}

            {distance.routeGpxUrl && (
              <div>
                <Button variant="outline" size="sm" asChild>
                  <a href={distance.routeGpxUrl} download className="gap-2">
                    <Download className="h-4 w-4" />
                    Pobierz plik GPX
                  </a>
                </Button>
              </div>
            )}

            {distance.routeFiles && distance.routeFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Dodatkowe pliki</h4>
                <div className="space-y-2">
                  {distance.routeFiles.map(file => (
                    <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg border">
                      {fileTypeIcons[file.type] || <FileText className="h-4 w-4" />}
                      <span className="flex-1 text-sm">{file.name}</span>
                      <Badge variant="outline" className="text-xs">{fileTypeLabels[file.type]}</Badge>
                      {(file.type === 'image' || file.type === 'map' || file.type === 'elevation') ? (
                        <Button variant="ghost" size="sm" onClick={() => setPreviewImage(file.url)}>
                          Podgląd
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={file.url} download>Pobierz</a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-size image preview */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          {previewImage && (
            <img src={previewImage} alt="Podgląd" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
