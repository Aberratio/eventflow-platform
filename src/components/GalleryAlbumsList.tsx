import { GalleryAlbum, GalleryPlatform } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Facebook, Instagram, ExternalLink, Image } from 'lucide-react';

const platformConfig: Record<GalleryPlatform, { icon: React.ElementType; label: string; className: string }> = {
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
                href={album.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
              >
                <div className={`p-2 rounded-lg bg-muted ${config.className}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
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
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
