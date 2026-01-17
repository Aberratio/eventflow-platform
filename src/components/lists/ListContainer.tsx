import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ListGroupProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const ListGroup = ({ title, children, className }: ListGroupProps) => {
  return (
    <div className={cn('', className)}>
      {title && (
        <div className="px-3 sm:px-4 py-2 bg-muted/30 border-b">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
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
