import React, { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EMAIL_VARIABLES } from '@/types/email';
import type { EmailVariableMeta } from '@/types/email';

interface VariableChipsListProps {
  /** Ref to the input/textarea where variable will be inserted at cursor position */
  targetRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  /** Called with new value after insertion, so React state stays in sync */
  onInsert: (newValue: string) => void;
  /** Current value of the target field (needed to compute insertion result) */
  currentValue: string;
  /** Optionally limit to one variable group */
  filterGroup?: EmailVariableMeta['group'];
  className?: string;
}

const GROUP_LABELS: Record<EmailVariableMeta['group'], string> = {
  uczestnik: 'Uczestnik',
  wydarzenie: 'Wydarzenie',
  platnosc: 'Płatność',
};

const GROUP_COLORS: Record<EmailVariableMeta['group'], string> = {
  uczestnik: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
  wydarzenie: 'bg-secondary/10 text-secondary-foreground border-secondary/30 hover:bg-secondary/20',
  platnosc: 'bg-accent/30 text-accent-foreground border-accent/40 hover:bg-accent/50',
};

export const VariableChipsList: React.FC<VariableChipsListProps> = ({
  targetRef,
  onInsert,
  currentValue,
  filterGroup,
  className,
}) => {
  const variables = filterGroup
    ? EMAIL_VARIABLES.filter(v => v.group === filterGroup)
    : EMAIL_VARIABLES;

  const groups = filterGroup
    ? [filterGroup]
    : (['uczestnik', 'wydarzenie', 'platnosc'] as const);

  const insertVariable = (variable: string) => {
    const el = targetRef.current;
    if (!el) {
      // Fallback: append at end
      onInsert(currentValue + variable);
      return;
    }

    const start = el.selectionStart ?? currentValue.length;
    const end = el.selectionEnd ?? currentValue.length;
    const newValue = currentValue.slice(0, start) + variable + currentValue.slice(end);
    onInsert(newValue);

    // Restore focus and move cursor after inserted variable
    requestAnimationFrame(() => {
      el.focus();
      const newPos = start + variable.length;
      el.setSelectionRange(newPos, newPos);
    });
  };

  return (
    <div className={className}>
      {groups.map(group => {
        const groupVars = variables.filter(v => v.group === group);
        if (groupVars.length === 0) return null;
        return (
          <div key={group} className="mb-2 last:mb-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              {GROUP_LABELS[group]}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {groupVars.map(meta => (
                <button
                  key={meta.variable}
                  type="button"
                  title={meta.description}
                  onClick={() => insertVariable(meta.variable)}
                  className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono transition-colors cursor-pointer ${GROUP_COLORS[group]}`}
                >
                  {meta.variable}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
