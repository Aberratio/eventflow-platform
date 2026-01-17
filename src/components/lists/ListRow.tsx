import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ListRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  highlighted?: boolean;
}

export const ListRow = ({
  icon,
  title,
  subtitle,
  meta,
  badge,
  action,
  href,
  onClick,
  className,
  highlighted = false,
}: ListRowProps) => {
  const content = (
    <div
      className={cn(
        'flex items-center gap-3 p-3 sm:p-4 border-b last:border-b-0 transition-colors',
        (href || onClick) && 'hover:bg-muted/50 cursor-pointer',
        highlighted && 'bg-primary/5',
        className
      )}
      onClick={onClick}
    >
      {/* Icon */}
      {icon && (
        <div className="text-xl sm:text-2xl shrink-0">{icon}</div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-sm sm:text-base truncate">{title}</h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Meta on the right */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {meta}
          </div>
        </div>
        
        {/* Meta on mobile - below title */}
        {meta && (
          <div className="flex items-center gap-3 mt-1.5 sm:hidden text-xs text-muted-foreground">
            {meta}
          </div>
        )}
      </div>

      {/* Action or chevron */}
      {action ? (
        <div className="shrink-0">{action}</div>
      ) : (href || onClick) ? (
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
      ) : null}
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};
