import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CheckboxItemProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: React.ElementType;
  dotClassName?: string;
  count?: number;
}

export const CheckboxItem = ({
  id,
  label,
  checked,
  onCheckedChange,
  icon: Icon,
  dotClassName,
  count,
}: CheckboxItemProps) => (
  <div className="flex min-h-6 items-center gap-2">
    <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
    <Label
      htmlFor={id}
      className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm font-normal text-foreground/90"
    >
      {dotClassName && <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dotClassName)} />}
      {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
      <span className="truncate">{label}</span>
    </Label>
    {typeof count === 'number' && (
      <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-xs text-muted-foreground">
        {count.toLocaleString('pl-PL')}
      </span>
    )}
  </div>
);
