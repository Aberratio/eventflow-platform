import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useEventFormState } from './hooks/useEventFormState';
import { EventFormStep1 } from './components/EventFormStep1';
import { EventFormStep2 } from './components/EventFormStep2';
import { EventFormStep3 } from './components/EventFormStep3';

const EventForm = () => {
  const form = useEventFormState();

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => form.navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do panelu
        </Button>

        <h1 className="text-3xl font-bold mb-2">
          {form.isEditing ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {form.step === 1 && 'Krok 1 z 3: Podstawowe informacje'}
          {form.step === 2 && 'Krok 2 z 3: Kategorie i dystanse'}
          {form.step === 3 && 'Krok 3 z 3: Podsumowanie i publikacja'}
        </p>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
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
        <div className="flex justify-between mt-8">
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
            <Button onClick={form.handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              {form.isEditing ? 'Zapisz zmiany' : 'Utwórz wydarzenie'}
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EventForm;
