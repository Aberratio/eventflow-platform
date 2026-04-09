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
        'flex items-center gap-3 border-b p-3 transition-colors last:border-b-0 sm:p-4',
        (href || onClick) && 'cursor-pointer hover:bg-muted/50',
        highlighted && 'bg-primary/5',
        className,
      )}
      onClick={onClick}
    >
      {/* Icon */}
      {icon && <div className="shrink-0 text-xl sm:text-2xl">{icon}</div>}

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-medium sm:text-base">{title}</h3>
              {badge}
            </div>
            {subtitle && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>

          {/* Meta on the right */}
          <div className="hidden shrink-0 items-center gap-3 sm:flex">{meta}</div>
        </div>

        {/* Meta on mobile - below title */}
        {meta && (
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground sm:hidden">
            {meta}
          </div>
        )}
      </div>

      {/* Action or chevron */}
      {action ? (
        <div className="shrink-0">{action}</div>
      ) : href || onClick ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
      ) : null}
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};
