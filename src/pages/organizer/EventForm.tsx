import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useEventFormState } from './hooks/useEventFormState';
import { appLogger } from '@/lib/logger';
import { EventFormStep1 } from './components/EventFormStep1';
import { EventFormStep2 } from './components/EventFormStep2';
import { EventFormStep3 } from './components/EventFormStep3';

const EventForm = () => {
  const form = useEventFormState();

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <Button variant="ghost" onClick={() => form.navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do panelu
        </Button>

        <h1 className="mb-2 text-3xl font-bold">
          {form.isEditing ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {form.step === 1 && 'Krok 1 z 3: Podstawowe informacje'}
          {form.step === 2 && 'Krok 2 z 3: Kategorie i dystanse'}
          {form.step === 3 && 'Krok 3 z 3: Podsumowanie i publikacja'}
        </p>

        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
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
        <div className="mt-8 flex justify-between">
          {form.step > 1 ? (
            <Button variant="outline" onClick={form.prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Wstecz
            </Button>
          ) : (
            <div />
          )}

          {form.step < 3 ? (
            <Button onClick={form.nextStep}>
              Dalej <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => {
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
              }}
              disabled={
                form.isSaving || (!form.isEditing && form.selectedEventCredit?.available === 0)
              }
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
    </Layout>
  );
};

export default EventForm;
