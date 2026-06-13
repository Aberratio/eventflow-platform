import { HelpCircle } from 'lucide-react';
import type React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FieldHelpProps {
  title?: string;
  description: string;
}

interface HelpLabelProps extends FieldHelpProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export const FieldHelp = ({ title = 'Szczegoly pola', description }: FieldHelpProps) => (
  <HoverCard openDelay={150} closeDelay={100}>
    <HoverCardTrigger asChild>
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={title}
      >
        <HelpCircle className="h-3 w-3" />
      </button>
    </HoverCardTrigger>
    <HoverCardContent align="start" className="w-72 space-y-1 text-sm">
      <p className="font-medium">{title}</p>
      <p className="leading-relaxed text-muted-foreground">{description}</p>
    </HoverCardContent>
  </HoverCard>
);

export const HelpLabel = ({ children, htmlFor, className, title, description }: HelpLabelProps) => (
  <div className={cn('flex items-center gap-1.5', className)}>
    <Label htmlFor={htmlFor}>{children}</Label>
    <FieldHelp title={title} description={description} />
  </div>
);
