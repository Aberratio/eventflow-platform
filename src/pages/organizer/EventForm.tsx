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

  return (
    <Layout>
      <div className="container max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Button variant="ghost" onClick={() => form.navigate(-1)} className="-ml-2 mb-4 max-w-full">
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do panelu
        </Button>

        <h1 className="mb-2 text-2xl font-bold tracking-normal sm:text-3xl">
          {form.isEditing ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground sm:mb-8 sm:text-base">
          {form.step === 1 && 'Krok 1 z 3: Podstawowe informacje'}
          {form.step === 2 && 'Krok 2 z 3: Kategorie i dystanse'}
          {form.step === 3 && 'Krok 3 z 3: Podsumowanie i publikacja'}
        </p>

        {/* Progress bar */}
        <div className="mb-6 flex gap-2 sm:mb-8" aria-label={`Krok ${form.step} z 3`}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${s <= form.step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        {form.step === 1 && <EventFormStep1 form={form} />}
        {form.step === 2 && <EventFormStep2 form={form} />}
        {form.step === 3 && <EventFormStep3 form={form} />}

        {/* Navigation buttons */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between sm:border-t-0 sm:pt-0">
          {form.step > 1 ? (
            <Button variant="outline" onClick={form.prevStep} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Wstecz
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {form.step < 3 ? (
            <Button onClick={form.nextStep} className="w-full sm:w-auto">
              Dalej <ArrowRight className="ml-2 h-4 w-4" />
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
      <PrivacyChangeConfirmDialog
        open={privacyDialogOpen}
        nextIsPrivate={form.isPrivate}
        isConfirming={form.isSaving}
        onOpenChange={setPrivacyDialogOpen}
        onConfirm={submitForm}
      />
    </Layout>
  );
};

export default EventForm;
