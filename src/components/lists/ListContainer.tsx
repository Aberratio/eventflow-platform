import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ListGroupProps {
  title?: string;
  count?: number;
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export const ListGroup = ({ title, count, children, className, sticky = true }: ListGroupProps) => {
  return (
    <div className={cn('', className)}>
      {title && (
        <div className={cn(
          'flex items-center justify-between px-3 sm:px-4 py-2',
          'bg-foreground/[0.03] border-l-2 border-l-warning',
          'border-b border-border/50',
          sticky && 'sticky top-0 z-10'
        )}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground font-medium">{count}</span>
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

  return (
    <Card className={cn('overflow-hidden', className)}>
      {children}
    </Card>
  );
};

interface ListEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const ListEmptyState = ({ icon, title, description, action }: ListEmptyStateProps) => {
  return (
    <div className="py-12 px-4 text-center">
      {icon && <div className="mb-4 flex justify-center opacity-50">{icon}</div>}
      <h3 className="font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      {action}
    </div>
  );
};
