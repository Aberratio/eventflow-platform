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
          'flex items-center justify-between px-3 sm:px-4 py-2.5',
          'bg-accent/40 border-l-4 border-l-primary',
          'border-b border-border',
          sticky && 'sticky top-0 z-10'
        )}>
          <h3 className="text-sm font-semibold text-foreground capitalize">{title}</h3>
          {count !== undefined && (
            <Badge className="text-xs px-2 py-0.5 bg-primary/15 text-primary border-0 hover:bg-primary/20">
              {count}
            </Badge>
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
