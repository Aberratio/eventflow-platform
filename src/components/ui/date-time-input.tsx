import * as React from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronDown, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type BasePickerProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> & {
  value?: string;
  onValueChange?: (value: string) => void;
};

const pickerButtonClasses =
  'h-9 w-full justify-between rounded-md border border-[color:var(--glass-border)] bg-black/10 px-3 py-2 text-left text-sm font-normal text-foreground ring-offset-transparent transition-all hover:border-[color:var(--glass-border-strong)] hover:bg-[var(--glass-bg-hover)] focus-visible:border-[color:var(--glass-border-accent)] focus-visible:ring-1 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40';

const parseDateValue = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const formatDateValue = (date: Date) => format(date, 'yyyy-MM-dd');

const displayDate = (value?: string) => {
  const date = parseDateValue(value);
  return date ? format(date, 'd MMMM yyyy', { locale: pl }) : null;
};

export interface DateInputProps extends BasePickerProps {
  placeholder?: string;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      id,
      name,
      value = '',
      onValueChange,
      className,
      disabled,
      required,
      placeholder = 'Wybierz date',
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const selected = parseDateValue(value);

    return (
      <div className="relative">
        <input
          ref={ref}
          type="hidden"
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          readOnly
          {...props}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-invalid={ariaInvalid}
              className={cn(
                pickerButtonClasses,
                !value && 'text-muted-foreground/80',
                ariaInvalid && 'border-destructive focus-visible:ring-destructive/40',
                className,
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{displayDate(value) || placeholder}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(date) => {
                onValueChange?.(date ? formatDateValue(date) : '');
                setOpen(false);
              }}
              initialFocus
              locale={pl}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);
DateInput.displayName = 'DateInput';

const timeOptions = Array.from({ length: 24 * 4 }, (_, index) => {
  const minutesTotal = index * 15;
  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

export interface TimeInputProps extends BasePickerProps {
  placeholder?: string;
  stepMinutes?: 5 | 10 | 15 | 30 | 60;
}

export const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  (
    {
      id,
      name,
      value = '',
      onValueChange,
      className,
      disabled,
      required,
      placeholder = 'Wybierz godzine',
      stepMinutes = 15,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const options = React.useMemo(
      () =>
        stepMinutes === 15
          ? timeOptions
          : Array.from({ length: Math.floor((24 * 60) / stepMinutes) }, (_, index) => {
              const minutesTotal = index * stepMinutes;
              const hours = Math.floor(minutesTotal / 60);
              const minutes = minutesTotal % 60;
              return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }),
      [stepMinutes],
    );

    return (
      <div className="relative">
        <input
          ref={ref}
          type="hidden"
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          readOnly
          {...props}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-invalid={ariaInvalid}
              className={cn(
                pickerButtonClasses,
                !value && 'text-muted-foreground/80',
                ariaInvalid && 'border-destructive focus-visible:ring-destructive/40',
                className,
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate font-mono">{value || placeholder}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-2">
            <div className="max-h-64 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-1">
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onValueChange?.(option);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex h-8 items-center justify-between rounded-md px-2 font-mono text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                      value === option && 'bg-primary text-primary-foreground hover:bg-primary',
                    )}
                  >
                    {option}
                    {value === option && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);
TimeInput.displayName = 'TimeInput';
