import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const FilterSection = ({ title, defaultOpen = true, children }: FilterSectionProps) => (
  <Collapsible defaultOpen={defaultOpen} className="py-3">
    <CollapsibleTrigger className="flex justify-between items-center w-full group">
      <span className="font-medium text-sm">{title}</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="pt-3 space-y-2">
      {children}
    </CollapsibleContent>
  </Collapsible>
);
