import { PersonStanding, Bike, Waves, Medal, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  running: PersonStanding,
  cycling: Bike,
  triathlon: Waves,
  multisport: Medal,
};

interface DisciplineIconProps {
  discipline: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DisciplineIcon = ({ discipline, className, size = 'md' }: DisciplineIconProps) => {
  const Icon = iconMap[discipline] || Medal;
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };
  
  return <Icon className={cn(sizeClasses[size], 'text-primary', className)} />;
};
