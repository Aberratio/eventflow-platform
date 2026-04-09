import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ListGroupProps {
  title?: string;
  count?: number;
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
  highlighted?: boolean;
}

export const ListGroup = ({
  title,
  count,
  children,
  className,
  sticky = true,
  highlighted = false,
}: ListGroupProps) => {
  return (
    <div className={cn('', className)}>
      {title && (
        <div
          className={cn(
            'flex items-center justify-between px-3 py-2 sm:px-4',
            'border-b border-border/50',
            highlighted
              ? 'border-l-2 border-l-primary bg-primary/[0.08]'
              : 'border-l-2 border-l-warning bg-foreground/[0.03]',
            sticky && 'sticky top-0 z-10',
          )}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </h3>
            {highlighted && (
              <Badge
                variant="outline"
                className="border-primary/30 px-1.5 py-0 text-[9px] font-medium text-primary"
              >
                Teraz
              </Badge>
            )}
          </div>
          {count !== undefined && (
            <span className="text-xs font-medium text-muted-foreground">{count}</span>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

interface ListContainerProps {
  children?: React.ReactNode;
  className?: string;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
}

export const ListContainer = ({ children, className, emptyState, isEmpty }: ListContainerProps) => {
  if (isEmpty && emptyState) {
    return <Card className={cn('overflow-hidden', className)}>{emptyState}</Card>;
  }

  return <Card className={cn('overflow-hidden', className)}>{children}</Card>;
};

interface ListEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const ListEmptyState = ({ icon, title, description, action }: ListEmptyStateProps) => {
  return (
    <div className="px-4 py-12 text-center">
      {icon && <div className="mb-4 flex justify-center opacity-50">{icon}</div>}
      <h3 className="mb-1 font-semibold">{title}</h3>
      {description && <p className="mb-4 text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
};
