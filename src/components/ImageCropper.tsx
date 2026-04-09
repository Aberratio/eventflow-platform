import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, Move } from 'lucide-react';

export interface CropArea {
  x: number; // % from left
  y: number; // % from top
  width: number; // % width
  height: number; // % height
}

interface ImageCropperProps {
  imageUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aspectRatio?: number; // e.g., 16/9, 3/4
  onCrop: (cropArea: CropArea) => void;
  title?: string;
}

export const ImageCropper = ({
  imageUrl,
  open,
  onOpenChange,
  aspectRatio = 16 / 9,
  onCrop,
  title = 'Przytnij obraz',
}: ImageCropperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 50, y: 50 }); // center position in %
  const [zoom, setZoom] = useState([100]); // zoom level 100-200%
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPosition({ x: 50, y: 50 });
      setZoom([100]);
      setImageLoaded(false);
    }
  }, [open]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

      setPosition((prev) => ({
        x: Math.max(0, Math.min(100, prev.x - deltaX)),
        y: Math.max(0, Math.min(100, prev.y - deltaY)),
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSave = () => {
    // Calculate crop area based on position and zoom
    const zoomFactor = zoom[0] / 100;
    const visibleWidth = 100 / zoomFactor;
    const visibleHeight = 100 / zoomFactor;

    const x = Math.max(0, position.x - visibleWidth / 2);
    const y = Math.max(0, position.y - visibleHeight / 2);

    onCrop({
      x: Math.min(x, 100 - visibleWidth),
      y: Math.min(y, 100 - visibleHeight),
      width: visibleWidth,
      height: visibleHeight,
    });
    onOpenChange(false);
  };

  const zoomFactor = zoom[0] / 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop area */}
          <div
            ref={containerRef}
            className="relative cursor-move select-none overflow-hidden rounded-lg bg-muted"
            style={{ aspectRatio }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              setIsDragging(true);
              setDragStart({ x: touch.clientX, y: touch.clientY });
            }}
            onTouchMove={(e) => {
              if (!isDragging || !containerRef.current) return;
              const touch = e.touches[0];
              const rect = containerRef.current.getBoundingClientRect();
              const deltaX = ((touch.clientX - dragStart.x) / rect.width) * 100;
              const deltaY = ((touch.clientY - dragStart.y) / rect.height) * 100;
              setPosition((prev) => ({
                x: Math.max(0, Math.min(100, prev.x - deltaX)),
                y: Math.max(0, Math.min(100, prev.y - deltaY)),
              }));
              setDragStart({ x: touch.clientX, y: touch.clientY });
            }}
            onTouchEnd={() => setIsDragging(false)}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              </div>
            )}
            <img
              src={imageUrl}
              alt="Podgląd"
              className="absolute transition-transform duration-75"
              style={{
                width: `${100 * zoomFactor}%`,
                height: `${100 * zoomFactor}%`,
                objectFit: 'cover',
                left: `${50 - position.x * zoomFactor}%`,
                top: `${50 - position.y * zoomFactor}%`,
                opacity: imageLoaded ? 1 : 0,
              }}
              onLoad={() => setImageLoaded(true)}
              draggable={false}
            />

            {/* Overlay hint */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm text-muted-foreground opacity-60 backdrop-blur-sm">
                <Move className="h-4 w-4" />
                Przeciągnij, aby przesunąć
              </div>
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-4 px-2">
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={zoom}
              onValueChange={setZoom}
              min={100}
              max={200}
              step={5}
              className="flex-1"
            />
            <span className="w-12 text-right text-sm text-muted-foreground">{zoom[0]}%</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSave}>Zapisz przycięcie</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
