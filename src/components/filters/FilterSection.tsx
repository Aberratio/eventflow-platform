import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const FilterSection = ({ title, defaultOpen = true, children }: FilterSectionProps) => (
  <Collapsible defaultOpen={defaultOpen} className="py-3">
    <CollapsibleTrigger className="group flex w-full items-center justify-between">
      <span className="text-sm font-medium">{title}</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="space-y-2 pt-3">{children}</CollapsibleContent>
  </Collapsible>
);
