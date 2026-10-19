import { ClipboardList, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formFieldLabel, VOIVODESHIPS } from '@/lib/formFields';
import { formatMoney } from '@/lib/format';
import type { FormField, FormFieldAnswerValue, FormFieldOption } from '@/types';

interface CustomFormFieldsStepProps {
  fields: FormField[];
  answers: Record<string, FormFieldAnswerValue>;
  errors: Record<string, string>;
  /** B-07: messages from the server's 422 `registration_form_invalid`, by form-field id. */
  serverErrors?: Record<string, string>;
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
  serverErrors = {},
  onChange,
}: CustomFormFieldsStepProps) => {
  const renderControl = (field: FormField) => {
    const id = `ff-${field.id}`;
    const value = answers[field.id];
    const options = field.options ?? [];
    const invalid = Boolean(errors[field.id] || serverErrors[field.id]);

    if (field.kind === 'system') {
      if (field.fieldKey === 'anonymization') {
        return (
          <div className="flex items-start gap-2">
            <Checkbox
              id={id}
              checked={value === true}
              onCheckedChange={(checked) => onChange(field.id, checked === true)}
            />
            <Label htmlFor={id} className="font-normal leading-snug">
              {formFieldLabel(field)}
            </Label>
          </div>
        );
      }
      if (field.fieldKey === 'voivodeship') {
        return (
          <Select
            value={typeof value === 'string' ? value : ''}
            onValueChange={(v) => onChange(field.id, v)}
          >
            <SelectTrigger id={id} aria-invalid={invalid}>
              <SelectValue placeholder="Wybierz województwo" />
            </SelectTrigger>
            <SelectContent>
              {VOIVODESHIPS.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      return (
        <Input
          id={id}
          type={field.fieldKey === 'phone' ? 'tel' : 'text'}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          aria-invalid={invalid}
        />
      );
    }

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

  const renderField = (field: FormField) => (
    <div key={field.id} className="space-y-2" data-testid={`form-field-${field.fieldKey}`}>
      {field.fieldType !== 'consent' && field.fieldKey !== 'anonymization' && (
        <Label htmlFor={`ff-${field.id}`} className="text-base font-medium">
          {formFieldLabel(field)}
          {field.state === 'required' && <span aria-hidden> *</span>}
        </Label>
      )}
      {field.tooltipOverride && (
        <p className="text-sm text-muted-foreground">{field.tooltipOverride}</p>
      )}
      {renderControl(field)}
      {(serverErrors[field.id] || (errors[field.id] && answers[field.id] !== undefined)) && (
        <p role="alert" className="text-sm text-destructive">
          {serverErrors[field.id] ?? errors[field.id]}
        </p>
      )}
    </div>
  );

  const identityFields = fields.filter((f) => f.kind === 'system');
  const customFields = fields.filter((f) => f.kind !== 'system');

  return (
    <div className="space-y-6">
      {identityFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" /> Dane kontaktowe i adresowe
            </CardTitle>
            <CardDescription>Pola oznaczone * są wymagane przez organizatora.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">{identityFields.map(renderField)}</CardContent>
        </Card>
      )}
      {customFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" /> Dodatkowe informacje
            </CardTitle>
            <CardDescription>
              Organizator prosi o kilka dodatkowych informacji. Pola oznaczone * są wymagane.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">{customFields.map(renderField)}</CardContent>
        </Card>
      )}
    </div>
  );
};
