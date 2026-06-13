import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEP_NAV_ITEMS, SubStep } from '../hooks/useEventFormState';

interface StepNavSidebarProps {
  currentStep: number;
  currentSubStep: SubStep;
  onNavigate: (subStep: SubStep) => void;
}

const STEP_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Podstawowe',
  2: 'Kategorie',
  3: 'Publikacja',
};

export const StepNavSidebar = ({ currentStep, currentSubStep, onNavigate }: StepNavSidebarProps) => {
  const groups = ([1, 2, 3] as const).map((mainStep) => ({
    mainStep,
    label: STEP_LABELS[mainStep],
    items: STEP_NAV_ITEMS.filter((item) => item.mainStep === mainStep),
  }));

  return (
    <nav className="w-52 shrink-0">
      <div className="sticky top-6 space-y-4">
        {groups.map(({ mainStep, label, items }) => {
          const isGroupActive = currentStep === mainStep;
          const isGroupDone = currentStep > mainStep;

          return (
            <div key={mainStep}>
              <div
                className={cn(
                  'mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider',
                  isGroupActive
                    ? 'text-primary'
                    : isGroupDone
                      ? 'text-muted-foreground/70'
                      : 'text-muted-foreground/40',
                )}
              >
                {isGroupDone && <Check className="h-3 w-3" />}
                <span>
                  {mainStep}. {label}
                </span>
              </div>

              <ul className="space-y-0.5">
                {items.map((item) => {
                  const isActive = currentSubStep === item.id && isGroupActive;
                  const isDone =
                    isGroupDone ||
                    (isGroupActive &&
                      STEP_NAV_ITEMS.findIndex((i) => i.id === item.id) <
                        STEP_NAV_ITEMS.findIndex((i) => i.id === currentSubStep));
                  const isAccessible = isGroupActive || isGroupDone;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => isAccessible && onNavigate(item.id)}
                        disabled={!isAccessible}
                        className={cn(
                          'group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 font-medium text-primary'
                            : isAccessible
                              ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              : 'cursor-not-allowed text-muted-foreground/30',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold',
                            isActive
                              ? 'border-primary bg-primary text-primary-foreground'
                              : isDone
                                ? 'border-primary/50 bg-primary/10 text-primary'
                                : 'border-muted-foreground/30 text-muted-foreground/30',
                          )}
                        >
                          {isDone && !isActive ? <Check className="h-2.5 w-2.5" /> : null}
                        </span>
                        <span className="truncate">{item.shortLabel}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
};
