import { AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEP_NAV_ITEMS, SubStep } from '../hooks/useEventFormState';

interface StepNavSidebarProps {
  currentStep: number;
  currentSubStep: SubStep;
  validationErrors?: Partial<Record<SubStep, string[]>>;
  completedSubSteps?: SubStep[];
  revisitedSubSteps?: SubStep[];
  onNavigate: (subStep: SubStep) => void;
}

const STEP_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Podstawowe',
  2: 'Kategorie',
  3: 'Sklep',
  4: 'Publikacja',
};

export const StepNavSidebar = ({
  currentStep,
  currentSubStep,
  validationErrors = {},
  completedSubSteps = [],
  revisitedSubSteps = [],
  onNavigate,
}: StepNavSidebarProps) => {
  const groups = ([1, 2, 3, 4] as const).map((mainStep) => ({
    mainStep,
    label: STEP_LABELS[mainStep],
    items: STEP_NAV_ITEMS.filter((item) => item.mainStep === mainStep),
  }));

  return (
    <nav className="w-full shrink-0 lg:w-48">
      <div className="sticky top-6 overflow-x-auto pb-2 lg:space-y-5 lg:overflow-visible lg:pb-0">
        <div className="flex min-w-max gap-3 lg:block lg:min-w-0 lg:space-y-5">
          {groups.map(({ mainStep, label, items }) => {
            const isGroupActive = currentStep === mainStep;
            const hasGroupError = items.some(
              (item) => (validationErrors[item.id]?.length ?? 0) > 0,
            );

            return (
              <div key={mainStep} className="min-w-36 lg:min-w-0">
                <div
                  className={cn(
                    'mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest',
                    hasGroupError
                      ? 'text-destructive'
                      : isGroupActive
                        ? 'text-primary'
                        : 'text-muted-foreground',
                  )}
                >
                  <span>
                    {mainStep}. {label}
                  </span>
                </div>

                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const isActive = currentSubStep === item.id;
                    const hasError = (validationErrors[item.id]?.length ?? 0) > 0;
                    const isComplete = completedSubSteps.includes(item.id) && !hasError;
                    const isRevisited = revisitedSubSteps.includes(item.id);
                    const activeStatus = !isRevisited
                      ? 'current'
                      : hasError
                        ? 'error'
                        : isComplete
                          ? 'complete'
                          : 'current';
                    const showErrorStatus = hasError && (!isActive || activeStatus === 'error');
                    const showCompleteStatus =
                      isComplete && (!isActive || activeStatus === 'complete');

                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onNavigate(item.id)}
                          className={cn(
                            'group flex w-full items-center gap-2.5 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors',
                            isActive &&
                              activeStatus === 'error' &&
                              'border-destructive/50 bg-destructive/10 font-semibold text-destructive hover:bg-destructive/15',
                            isActive &&
                              activeStatus === 'complete' &&
                              'border-green-600/40 bg-green-600/10 font-semibold text-green-700 hover:bg-green-600/15',
                            isActive &&
                              activeStatus === 'current' &&
                              'border-primary/70 bg-primary/10 font-semibold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
                            !isActive &&
                              hasError &&
                              'border-transparent text-destructive hover:bg-transparent hover:text-destructive',
                            !isActive &&
                              isComplete &&
                              'border-transparent text-green-700 hover:bg-transparent hover:text-green-700',
                            !isActive &&
                              !hasError &&
                              !isComplete &&
                              'border-transparent text-foreground/70 hover:bg-white/[0.035] hover:text-foreground',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                              showErrorStatus
                                ? 'text-destructive'
                                : showCompleteStatus
                                  ? 'text-green-700'
                                  : isActive
                                    ? 'border border-primary bg-primary text-primary-foreground'
                                    : 'border border-border text-muted-foreground/50',
                            )}
                          >
                            {showErrorStatus ? (
                              <AlertCircle className="h-2.5 w-2.5" />
                            ) : showCompleteStatus ? (
                              <Check className="h-2.5 w-2.5" />
                            ) : null}
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
      </div>
    </nav>
  );
};
