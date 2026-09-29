import { useId, useState } from 'react';
import { disciplineLabels } from '@/api';
import { SportDiscipline } from '@/types';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelpLabel } from '@/components/ui/field-help';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';

interface DisciplineMultiSelectProps {
  selected: SportDiscipline[];
  onChange: (v: SportDiscipline[]) => void;
}

// PP.16: the discipline chips used to render as <button> elements inside the combobox trigger
// <button>, which is invalid HTML (WCAG 4.1.2 / axe nested-interactive) and a React
// validateDOMNesting warning. The chips now render as a separate list below the trigger.
export const DisciplineMultiSelect = ({ selected, onChange }: DisciplineMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const triggerId = useId();
  const allEntries = Object.entries(disciplineLabels) as [SportDiscipline, string][];

  const toggle = (key: SportDiscipline) => {
    const next = selected.includes(key) ? selected.filter((d) => d !== key) : [...selected, key];
    if (next.length > 0) onChange(next);
  };

  return (
    <div className="space-y-2">
      <HelpLabel
        htmlFor={triggerId}
        description="Określa typy sportów. Wpływa na ikony, filtry wydarzeń i sposób prezentacji wydarzenia w serwisie. Można wybrać kilka."
      >
        Dyscyplina *
      </HelpLabel>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            className="h-auto min-h-10 w-full justify-between border-input bg-background px-3 py-2 text-left font-normal hover:bg-background"
          >
            <span className={selected.length ? '' : 'text-muted-foreground'}>
              {selected.length === 0
                ? 'Wybierz dyscypliny…'
                : selected.map((key) => disciplineLabels[key]).join(', ')}
            </span>
            <ChevronsUpDown aria-hidden="true" className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Szukaj dyscypliny…" />
            <CommandList>
              <CommandEmpty>Brak wyników.</CommandEmpty>
              <CommandGroup>
                {allEntries.map(([key, label]) => (
                  <CommandItem key={key} value={label} onSelect={() => toggle(key)}>
                    <Check
                      className={`mr-2 h-4 w-4 ${selected.includes(key) ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <DisciplineIcon discipline={key} size="sm" className="mr-2 h-4 w-4 shrink-0" />
                    {label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <ul aria-label="Wybrane dyscypliny" className="flex flex-wrap gap-1">
          {selected.map((key) => (
            <li
              key={key}
              className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 py-0.5 pl-2 pr-0.5 text-xs font-medium text-primary"
            >
              <DisciplineIcon discipline={key} size="sm" className="h-3 w-3 shrink-0" />
              {disciplineLabels[key]}
              {selected.length > 1 && (
                <button
                  type="button"
                  aria-label={`Usuń dyscyplinę: ${disciplineLabels[key]}`}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-sm opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => toggle(key)}
                >
                  <X aria-hidden="true" className="h-3 w-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
