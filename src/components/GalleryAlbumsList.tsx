import { safeUrl } from '@/lib/safeUrl';
import { GalleryAlbum, GalleryPlatform } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Facebook, Instagram, ExternalLink, Image } from 'lucide-react';

const platformConfig: Record<
  GalleryPlatform,
  { icon: React.ElementType; label: string; className: string }
> = {
  google_photos: { icon: Camera, label: 'Google Photos', className: 'text-destructive' },
  flickr: { icon: Camera, label: 'Flickr', className: 'text-pink-500' },
  facebook: { icon: Facebook, label: 'Facebook', className: 'text-blue-600' },
  instagram: { icon: Instagram, label: 'Instagram', className: 'text-purple-500' },
  other: { icon: Image, label: 'Album', className: 'text-muted-foreground' },
};

interface GalleryAlbumsListProps {
  albums: GalleryAlbum[];
}

export const GalleryAlbumsList = ({ albums }: GalleryAlbumsListProps) => {
  if (albums.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Galeria i albumy
        </CardTitle>
        <CardDescription>
          Przeglądaj zdjęcia z wydarzenia na zewnętrznych platformach
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {albums.map((album) => {
            const config = platformConfig[album.platform];
            const Icon = config.icon;

            return (
              <a
                key={album.id}
                href={safeUrl(album.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div className={`rounded-lg bg-muted p-2 ${config.className}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
                    {album.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{config.label}</span>
                    {album.photographer && (
                      <>
                        <span>•</span>
                        <span>Fot. {album.photographer}</span>
                      </>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
