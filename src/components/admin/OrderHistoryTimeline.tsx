import { OrderHistoryEntry, OrderHistoryAction } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { RefreshCw, Package, DollarSign, Truck, FileText, MessageSquare, PlusCircle } from 'lucide-react';

const actionIcons: Record<OrderHistoryAction, React.ElementType> = {
  status_change: RefreshCw,
  items_edited: Package,
  price_adjustment: DollarSign,
  tracking_updated: Truck,
  notes_updated: FileText,
  cancel_reason: MessageSquare,
  created: PlusCircle,
};

interface OrderHistoryTimelineProps {
  entries: OrderHistoryEntry[];
}

export const OrderHistoryTimeline = ({ entries }: OrderHistoryTimelineProps) => {
  const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak wpisów w historii.</p>;
  }

  return (
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
  );
};
