import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CheckboxItemProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: React.ElementType;
}

export const CheckboxItem = ({
  id,
  label,
  checked,
  onCheckedChange,
  icon: Icon,
}: CheckboxItemProps) => (
  <div className="flex items-center space-x-2">
    <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
    <Label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm font-normal">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      {label}
    </Label>
  </div>
);
