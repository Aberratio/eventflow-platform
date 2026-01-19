import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  maxVisible?: number;
}

export const ImageGallery = ({ images, maxVisible = 6 }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const visibleImages = images.slice(0, maxVisible);
  const remainingCount = images.length - maxVisible;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (selectedIndex === null) return;
    
    if (e.key === 'ArrowLeft') {
      setSelectedIndex(prev => (prev !== null && prev > 0 ? prev - 1 : images.length - 1));
    } else if (e.key === 'ArrowRight') {
      setSelectedIndex(prev => (prev !== null && prev < images.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'Escape') {
      setSelectedIndex(null);
    }
  }, [selectedIndex, images.length]);

  useEffect(() => {
    if (selectedIndex !== null) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedIndex, handleKeyDown]);

  const goToPrevious = () => {
    setSelectedIndex(prev => (prev !== null && prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setSelectedIndex(prev => (prev !== null && prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleImages.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <img
              src={image}
              alt={`Zdjęcie ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
        
        {remainingCount > 0 && (
          <button
            onClick={() => setSelectedIndex(maxVisible)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <img
              src={images[maxVisible]}
              alt={`Zdjęcie ${maxVisible + 1}`}
              className="h-full w-full object-cover brightness-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">+{remainingCount}</span>
            </div>
          </button>
        )}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Image */}
            {selectedIndex !== null && (
              <img
                src={images[selectedIndex]}
                alt={`Zdjęcie ${selectedIndex + 1}`}
                className="max-h-[80vh] max-w-full object-contain p-4"
              />
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              {selectedIndex !== null ? selectedIndex + 1 : 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
