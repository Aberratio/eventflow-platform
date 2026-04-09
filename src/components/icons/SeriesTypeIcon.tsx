import { Globe, MapPin, Trophy, Target, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SeriesType } from '@/types';

const iconMap: Record<SeriesType, LucideIcon> = {
  virtual: Globe,
  local: MapPin,
  championship: Trophy,
  cup: Target,
};

interface SeriesTypeIconProps {
  type: SeriesType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SeriesTypeIcon = ({ type, className, size = 'md' }: SeriesTypeIconProps) => {
  const Icon = iconMap[type] || Target;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };

  return <Icon className={cn(sizeClasses[size], 'text-primary', className)} />;
};
