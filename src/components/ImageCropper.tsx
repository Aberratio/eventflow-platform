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
  outputWidth?: number;
  outputHeight?: number;
  onCrop: (cropArea: CropArea, croppedBlob?: Blob) => void | Promise<void>;
  title?: string;
}

export const ImageCropper = ({
  imageUrl,
  open,
  onOpenChange,
  aspectRatio = 16 / 9,
  outputWidth = 1200,
  outputHeight,
  onCrop,
  title = 'Przytnij obraz',
}: ImageCropperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 50, y: 50 }); // center position in %
  const [zoom, setZoom] = useState([100]); // zoom level 100-200%
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const getCropArea = (): CropArea => {
    const image = imageRef.current;
    const naturalAspect =
      image && image.naturalWidth > 0 && image.naturalHeight > 0
        ? image.naturalWidth / image.naturalHeight
        : aspectRatio;
    const zoomFactor = zoom[0] / 100;
    let visibleWidth = 100 / zoomFactor;
    let visibleHeight = 100 / zoomFactor;

    if (naturalAspect > aspectRatio) {
      visibleWidth = visibleHeight * (aspectRatio / naturalAspect);
    } else {
      visibleHeight = visibleWidth * (naturalAspect / aspectRatio);
    }

    const x = Math.max(0, position.x - visibleWidth / 2);
    const y = Math.max(0, position.y - visibleHeight / 2);

    return {
      x: Math.min(x, 100 - visibleWidth),
      y: Math.min(y, 100 - visibleHeight),
      width: visibleWidth,
      height: visibleHeight,
    };
  };

  const createCroppedBlob = (cropArea: CropArea): Promise<Blob | undefined> => {
    const image = imageRef.current;
    if (!image || image.naturalWidth === 0 || image.naturalHeight === 0) {
      return Promise.resolve(undefined);
    }

    const canvas = document.createElement('canvas');
    const targetWidth = outputWidth;
    const targetHeight = outputHeight ?? Math.round(outputWidth / aspectRatio);
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) return Promise.resolve(undefined);

    context.drawImage(
      image,
      (cropArea.x / 100) * image.naturalWidth,
      (cropArea.y / 100) * image.naturalHeight,
      (cropArea.width / 100) * image.naturalWidth,
      (cropArea.height / 100) * image.naturalHeight,
      0,
      0,
      targetWidth,
      targetHeight,
    );

    return new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob ?? undefined), 'image/jpeg', 0.9),
    );
  };

  const handleSave = async () => {
    const cropArea = getCropArea();
    setIsSaving(true);
    try {
      const croppedBlob = await createCroppedBlob(cropArea);
      await onCrop(cropArea, croppedBlob);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
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
              ref={imageRef}
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
          <Button onClick={handleSave} disabled={isSaving || !imageLoaded}>
            {isSaving ? 'Zapisywanie...' : 'Zapisz przyciecie'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
