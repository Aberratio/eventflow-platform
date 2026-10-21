import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { Distance } from '@/types';

interface ResultsFiltersProps {
  distances: Distance[];
  selectedDistance: string;
  onDistanceChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedGender: string;
  onGenderChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categories: string[];
}

export const ResultsFilters = ({
  distances,
  selectedDistance,
  onDistanceChange,
  selectedCategory,
  onCategoryChange,
  selectedGender,
  onGenderChange,
  searchQuery,
  onSearchChange,
  categories,
}: ResultsFiltersProps) => {
  const hasFilters =
    selectedDistance !== 'all' ||
    selectedCategory !== 'all' ||
    selectedGender !== 'all' ||
    searchQuery;

  const handleClearFilters = () => {
    onDistanceChange('all');
    onCategoryChange('all');
    onGenderChange('all');
    onSearchChange('');
  };

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj po nazwisku..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Distance filter */}
      <Select value={selectedDistance} onValueChange={onDistanceChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Dystans" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie</SelectItem>
          {distances.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category filter */}
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Kategoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Gender filter */}
      <Select value={selectedGender} onValueChange={onGenderChange}>
        <SelectTrigger className="w-full sm:w-[120px]">
          <SelectValue placeholder="Płeć" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszyscy</SelectItem>
          <SelectItem value="M">Mężczyźni</SelectItem>
          <SelectItem value="K">Kobiety</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          aria-label="Wyczyść filtry"
          variant="ghost"
          size="icon"
          onClick={handleClearFilters}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
