import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useState } from 'react';
import { useEventFormState } from './hooks/useEventFormState';
import { appLogger } from '@/lib/logger';
import { EventFormStep1 } from './components/EventFormStep1';
import { EventFormStep2 } from './components/EventFormStep2';
import { EventFormStep3 } from './components/EventFormStep3';
import { PrivacyChangeConfirmDialog } from './components/PrivacyChangeConfirmDialog';
import { StepNavSidebar } from './components/StepNavSidebar';
import { UnsavedChangesDialog } from './components/UnsavedChangesDialog';

const EventForm = () => {
  const form = useEventFormState();
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);

  const submitForm = () => {
    appLogger.event(
      form.isEditing ? 'event_update' : 'event_create',
      form.isEditing
        ? `Zaktualizowano wydarzenie «${form.name}»`
        : `Utworzono wydarzenie «${form.name}»`,
      {
        targetType: 'event',
        targetName: form.name,
        metadata: { discipline: form.discipline },
      },
    );
    form.handleSubmit();
  };

  const handleSaveClick = () => {
    if (form.privacyChanged) {
      setPrivacyDialogOpen(true);
      return;
    }
    submitForm();
  };

  const completedSubSteps = form.visitedSubSteps.filter(
    (item) => (form.sectionValidationErrors[item]?.length ?? 0) === 0,
  );

  return (
    <Layout>
      <div className="container max-w-6xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => form.navigate(-1)}
          className="-ml-2 mb-5 h-8 max-w-full px-2 text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do panelu
        </Button>

        <h1 className="mb-6 text-2xl font-bold tracking-normal sm:text-[1.7rem]">
          {form.isEditing ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
        </h1>

        <div className="flex gap-8 lg:gap-9">
          {/* Left sticky sidebar */}
          <div className="hidden lg:block">
            <StepNavSidebar
              currentStep={form.step}
              currentSubStep={form.subStep}
              validationErrors={form.sectionValidationErrors}
              completedSubSteps={completedSubSteps}
              revisitedSubSteps={form.revisitedSubSteps}
              onNavigate={form.navigateToSubStep}
            />
          </div>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {form.step === 1 && <EventFormStep1 form={form} activeSubStep={form.subStep} />}
            {form.step === 2 && <EventFormStep2 form={form} activeSubStep={form.subStep} />}
            {form.step === 3 && <EventFormStep3 form={form} />}

            {/* Navigation buttons */}
            <div className="mt-5 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between sm:border-t-0 sm:pt-0">
              {form.step > 1 || form.subStep !== 'basic' ? (
                <Button variant="outline" onClick={form.prevStep} className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Wstecz
                </Button>
              ) : (
                <div className="hidden sm:block" />
              )}

              {form.step < 3 ? (
                <Button onClick={form.nextStep} className="w-full sm:w-auto">
                  Zapisz i przejdź dalej <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSaveClick}
                  disabled={
                    form.isSaving || (!form.isEditing && form.selectedEventLimit?.available === 0)
                  }
                  className="w-full sm:w-auto"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {form.isSaving
                    ? 'Zapisywanie...'
                    : form.isEditing
                      ? 'Zapisz zmiany'
                      : 'Utwórz wydarzenie'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <PrivacyChangeConfirmDialog
        open={privacyDialogOpen}
        nextIsPrivate={form.isPrivate}
        isConfirming={form.isSaving}
        onOpenChange={setPrivacyDialogOpen}
        onConfirm={submitForm}
      />

      <UnsavedChangesDialog
        open={form.pendingSubStep !== null}
        onDiscard={form.confirmNavigatePendingSubStep}
        onStay={form.cancelNavigatePendingSubStep}
      />
    </Layout>
  );
};

export default EventForm;
