import { saveFormFieldAnswer } from '@/api';
import type { FormFieldAnswerValue } from '@/types';

/**
 * E1.13: the server stores answers to custom form fields on the Zapis through a separate
 * PUT per field (there is no field on POST /registrations for them), so they are sent right
 * after the Zapis exists. A failed answer never undoes the Zapis: the failures are returned
 * so the page can tell the Zawodnik what to complete later.
 */
export const submitFormFieldAnswers = async (
  registrationId: string,
  answers: Record<string, FormFieldAnswerValue> | undefined,
): Promise<{ fieldId: string; message: string }[]> => {
  const failures: { fieldId: string; message: string }[] = [];
  for (const [fieldId, value] of Object.entries(answers ?? {})) {
    try {
      await saveFormFieldAnswer(registrationId, fieldId, value);
    } catch (error) {
      failures.push({
        fieldId,
        message: error instanceof Error ? error.message : 'Nie udało się zapisać odpowiedzi.',
      });
    }
  }
  return failures;
};
