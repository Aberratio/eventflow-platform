import { Info, Lightbulb, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorHintProps {
  variant: 'info' | 'tip' | 'warning';
  children: React.ReactNode;
  className?: string;
}

const variants = {
  info: {
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    icon: Info,
    iconColor: 'text-primary',
  },
  tip: {
    bg: 'bg-chart-4/10',
    border: 'border-chart-4/30',
    icon: Lightbulb,
    iconColor: 'text-chart-4',
  },
  warning: {
    bg: 'bg-destructive/5',
    border: 'border-destructive/20',
    icon: AlertTriangle,
    iconColor: 'text-destructive',
  },
};

export const EditorHint = ({ variant, children, className }: EditorHintProps) => {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex gap-3 p-3 rounded-lg border text-sm',
      config.bg,
      config.border,
      className
    )}>
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)} />
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
};
