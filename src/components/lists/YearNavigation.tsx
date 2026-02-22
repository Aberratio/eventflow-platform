import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearNavigationProps {
  selectedYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
}

export const YearNavigation = ({ selectedYear, availableYears, onYearChange }: YearNavigationProps) => {
  return (
    <div className="flex items-center justify-center gap-4 mb-6 bg-card/50 border border-warning/10 rounded-lg py-3">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onYearChange(selectedYear - 1)}
        disabled={!availableYears.includes(selectedYear - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-xl font-bold min-w-[80px] text-center">{selectedYear}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onYearChange(selectedYear + 1)}
        disabled={!availableYears.includes(selectedYear + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
