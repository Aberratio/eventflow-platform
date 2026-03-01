import { useState } from 'react';
import { OrderHistoryEntry, OrderHistoryAction } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { RefreshCw, Package, DollarSign, Truck, FileText, MessageSquare, PlusCircle, Filter } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const actionIcons: Record<OrderHistoryAction, React.ElementType> = {
  status_change: RefreshCw,
  items_edited: Package,
  price_adjustment: DollarSign,
  tracking_updated: Truck,
  notes_updated: FileText,
  cancel_reason: MessageSquare,
  created: PlusCircle,
};

const actionLabels: Record<OrderHistoryAction, string> = {
  status_change: 'Status',
  items_edited: 'Produkty',
  price_adjustment: 'Korekta',
  tracking_updated: 'Przesyłka',
  notes_updated: 'Notatki',
  cancel_reason: 'Anulowanie',
  created: 'Utworzenie',
};

interface OrderHistoryTimelineProps {
  entries: OrderHistoryEntry[];
}

export const OrderHistoryTimeline = ({ entries }: OrderHistoryTimelineProps) => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const availableActions = [...new Set(entries.map(e => e.action))];

  const filtered = activeFilters.length > 0
    ? entries.filter(e => activeFilters.includes(e.action))
    : entries;

  const sorted = [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak wpisów w historii.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {availableActions.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <TooltipProvider>
            <ToggleGroup type="multiple" value={activeFilters} onValueChange={setActiveFilters} className="flex-wrap gap-1">
              {availableActions.map(action => {
                const Icon = actionIcons[action] || FileText;
                return (
                  <Tooltip key={action}>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value={action} size="sm" variant="outline" className="gap-1.5 text-xs h-7 px-2">
                        <Icon className="h-3 w-3" />
                        {actionLabels[action]}
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Filtruj: {actionLabels[action]}</TooltipContent>
                  </Tooltip>
                );
              })}
            </ToggleGroup>
          </TooltipProvider>
        </div>
      )}

      {/* Timeline */}
      <div className="relative space-y-0">
      {/* vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

      {sorted.map((entry, idx) => {
        const Icon = actionIcons[entry.action] || FileText;
        return (
          <div key={entry.id} className="relative flex gap-4 py-3">
            {/* dot */}
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {/* content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{entry.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {entry.userName} · {format(new Date(entry.timestamp), 'd MMM yyyy, HH:mm', { locale: pl })}
              </p>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};
