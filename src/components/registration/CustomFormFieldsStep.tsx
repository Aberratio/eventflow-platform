import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formFieldLabel } from '@/lib/formFields';
import { formatMoney } from '@/lib/format';
import type { FormField, FormFieldAnswerValue, FormFieldOption } from '@/types';

interface CustomFormFieldsStepProps {
  fields: FormField[];
  answers: Record<string, FormFieldAnswerValue>;
  errors: Record<string, string>;
  onChange: (fieldId: string, value: FormFieldAnswerValue) => void;
}

/** "+5,00 zł" / "-5,00 zł" next to a variant; nothing for a free one. */
const optionPriceHint = (option: FormFieldOption): string => {
  if (!option.price) return '';
  return ` (${option.price > 0 ? '+' : '-'}${formatMoney(Math.abs(option.price))})`;
};

/**
 * E1.13: the custom positions of the organizer-configured registration form. Rendered by type,
 * in the order the organizer set; "Wymagany" ones carry an asterisk and block the step until
 * they are answered (the server validates again on save).
 */
export const CustomFormFieldsStep = ({
  fields,
  answers,
  errors,
  onChange,
}: CustomFormFieldsStepProps) => {
  const renderControl = (field: FormField) => {
    const id = `ff-${field.id}`;
    const value = answers[field.id];
    const options = field.options ?? [];
    const invalid = Boolean(errors[field.id]);

    switch (field.fieldType) {
      case 'long_text':
        return (
          <Textarea
            id={id}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            aria-invalid={invalid}
          />
        );
      case 'number':
        return (
          <Input
            id={id}
            type="number"
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(e) => onChange(field.id, e.target.value)}
            aria-invalid={invalid}
          />
        );
      case 'date':
        return (
          <Input
            id={id}
            type="date"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            aria-invalid={invalid}
          />
        );
      case 'single_choice':
        return (
          <RadioGroup
            value={typeof value === 'string' ? value : ''}
            onValueChange={(v) => onChange(field.id, v)}
          >
            {options.map((option) => (
              <div key={option.key} className="flex items-center gap-2">
                <RadioGroupItem value={option.key} id={`${id}-${option.key}`} />
                <Label htmlFor={`${id}-${option.key}`} className="font-normal">
                  {option.label}
                  {optionPriceHint(option)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'multi_choice': {
        const selected = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.key} className="flex items-center gap-2">
                <Checkbox
                  id={`${id}-${option.key}`}
                  checked={selected.includes(option.key)}
                  onCheckedChange={(checked) =>
                    onChange(
                      field.id,
                      checked
                        ? [...selected, option.key]
                        : selected.filter((key) => key !== option.key),
                    )
                  }
                />
                <Label htmlFor={`${id}-${option.key}`} className="font-normal">
                  {option.label}
                  {optionPriceHint(option)}
                </Label>
              </div>
            ))}
          </div>
        );
      }
      case 'consent':
        return (
          <div className="flex items-start gap-2">
            <Checkbox
              id={id}
              checked={value === true}
              onCheckedChange={(checked) => onChange(field.id, checked === true)}
            />
            <Label htmlFor={id} className="font-normal leading-snug">
              {formFieldLabel(field)}
              {field.state === 'required' && <span aria-hidden> *</span>}
            </Label>
          </div>
        );
      default:
        return (
          <Input
            id={id}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            maxLength={field.validationConfig?.maxLength || undefined}
            aria-invalid={invalid}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" /> Dodatkowe informacje
        </CardTitle>
        <CardDescription>
          Organizator prosi o kilka dodatkowych informacji. Pola oznaczone * są wymagane.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2" data-testid={`form-field-${field.fieldKey}`}>
            {field.fieldType !== 'consent' && (
              <Label htmlFor={`ff-${field.id}`} className="text-base font-medium">
                {formFieldLabel(field)}
                {field.state === 'required' && <span aria-hidden> *</span>}
              </Label>
            )}
            {field.tooltipOverride && (
              <p className="text-sm text-muted-foreground">{field.tooltipOverride}</p>
            )}
            {renderControl(field)}
            {errors[field.id] && answers[field.id] !== undefined && (
              <p role="alert" className="text-sm text-destructive">
                {errors[field.id]}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
