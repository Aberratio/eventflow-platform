import React from 'react';
import { Controller, Control, UseFormRegister } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { EmailTriggerType, EmailTemplateScope } from '@/types/email';
import { EMAIL_TRIGGER_LABELS, EVENT_TRIGGER_TYPES, SYSTEM_TRIGGER_TYPES } from '@/types/email';

function getTriggerOptions(
  scope: EmailTemplateScope,
): Array<{ value: EmailTriggerType; label: string }> {
  const triggers = scope === 'system' ? SYSTEM_TRIGGER_TYPES : EVENT_TRIGGER_TYPES;
  return triggers.map((value) => ({ value, label: EMAIL_TRIGGER_LABELS[value] }));
}

interface EmailTriggerSectionProps {
  scope: EmailTemplateScope;
  control: Control<any>;
  register: UseFormRegister<any>;
  triggerType: string;
  scheduleEnabled: boolean;
}

export const EmailTriggerSection: React.FC<EmailTriggerSectionProps> = ({
  scope,
  control,
  register,
  triggerType,
  scheduleEnabled,
}) => {
  const triggerOptions = getTriggerOptions(scope);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Wyzwalacz</h3>

      <Controller
        name="triggerType"
        control={control}
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-2">
            {triggerOptions.map(({ value, label }) => (
              <div key={value} className="flex items-center gap-3">
                <RadioGroupItem value={value} id={`trigger-${value}`} />
                <Label htmlFor={`trigger-${value}`} className="flex-1 cursor-pointer font-normal">
                  {label}
                </Label>
                {field.value === value &&
                  (value === 'days_before_event' || value === 'days_after_registration') && (
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      className="h-7 w-20 text-sm"
                      placeholder="dni"
                      {...register('triggerDaysOffset', { valueAsNumber: true })}
                    />
                  )}
              </div>
            ))}
          </RadioGroup>
        )}
      />

      {triggerType === 'manual' && (
        <div className="ml-6 space-y-3 rounded-md border bg-muted/20 p-3">
          <div className="flex items-center gap-3">
            <Controller
              name="scheduleEnabled"
              control={control}
              render={({ field }) => (
                <Switch
                  id="schedule-switch"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="schedule-switch" className="cursor-pointer font-normal">
              Zaplanuj wysyłkę na określoną datę
            </Label>
          </div>

          {scheduleEnabled && (
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Data</Label>
                <Input type="date" className="h-8" {...register('scheduledDate')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Godzina</Label>
                <Input type="time" className="h-8 w-28" {...register('scheduledTime')} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
