import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const REGISTRATION_STATUSES = [
  { value: 'pending', label: 'Oczekujący' },
  { value: 'confirmed', label: 'Potwierdzony' },
  { value: 'cancelled', label: 'Anulowany' },
];

interface EmailRecipientsSectionProps {
  control: Control<any>;
}

export const EmailRecipientsSection: React.FC<EmailRecipientsSectionProps> = ({ control }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Odbiorcy</h3>

      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Status rejestracji
        </Label>
        <div className="flex flex-wrap gap-4">
          {REGISTRATION_STATUSES.map(({ value, label }) => (
            <Controller
              key={value}
              name="filterStatuses"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${value}`}
                    checked={field.value.includes(value)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...field.value, value]
                        : field.value.filter((s: string) => s !== value);
                      field.onChange(next);
                    }}
                  />
                  <Label
                    htmlFor={`status-${value}`}
                    className="font-normal cursor-pointer"
                  >
                    {label}
                  </Label>
                </div>
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Status płatności
        </Label>
        <Controller
          name="filterPaymentStatus"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszyscy</SelectItem>
                <SelectItem value="paid">Tylko opłaceni</SelectItem>
                <SelectItem value="unpaid">Tylko nieopłaceni</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </div>
  );
};
