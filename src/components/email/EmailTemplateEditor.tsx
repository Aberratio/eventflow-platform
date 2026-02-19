import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge'; // used for active field indicator
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Eye, FileText, HelpCircle, Loader2, Save } from 'lucide-react';
import type {
  EmailTemplate,
  EmailTriggerType,
  CreateEmailTemplatePayload,
} from '@/types/email';
import { EMAIL_TRIGGER_LABELS, EMAIL_VARIABLES } from '@/types/email';
import { VariableChipsList } from './VariableChipsList';
import { previewEmailTemplate } from '@/api/email-templates.api';

// ──────────────── Validation Schema ────────────────

const schema = z.object({
  name: z.string().trim().min(1, 'Podaj nazwę szablonu').max(120),
  subject: z.string().trim().min(1, 'Podaj temat emaila').max(200),
  body: z.string().trim().min(10, 'Treść musi mieć co najmniej 10 znaków').max(10_000),
  triggerType: z.enum([
    'on_registration',
    'on_payment_confirmed',
    'on_registration_cancelled',
    'on_event_approved',
    'on_bib_assigned',
    'days_before_event',
    'days_after_registration',
    'manual',
  ] as const),
  triggerDaysOffset: z.number().min(1).max(365).optional(),
  active: z.boolean(),
  filterStatuses: z.array(z.string()),
  filterPaymentStatus: z.enum(['all', 'paid', 'unpaid']),
  // scheduling (manual only)
  scheduleEnabled: z.boolean(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ──────────────── Helpers ────────────────

const TRIGGER_OPTIONS: Array<{ value: EmailTriggerType; label: string }> = (
  Object.entries(EMAIL_TRIGGER_LABELS) as Array<[EmailTriggerType, string]>
).map(([value, label]) => ({ value, label }));

function templateToFormValues(t?: EmailTemplate): FormValues {
  return {
    name: t?.name ?? '',
    subject: t?.subject ?? '',
    body: t?.body ?? '',
    triggerType: t?.triggerType ?? 'on_registration',
    triggerDaysOffset: t?.triggerDaysOffset,
    active: t?.active ?? true,
    filterStatuses: t?.recipientFilter?.statuses ?? ['pending', 'confirmed'],
    filterPaymentStatus: t?.recipientFilter?.paymentStatus ?? 'all',
    scheduleEnabled: false,
    scheduledDate: '',
    scheduledTime: '08:00',
  };
}

// ──────────────── Component ────────────────

interface EmailTemplateEditorProps {
  open: boolean;
  onClose: () => void;
  template?: EmailTemplate;
  eventId?: string;
  onSave: (payload: CreateEmailTemplatePayload) => Promise<void>;
}

const REGISTRATION_STATUSES = [
  { value: 'pending', label: 'Oczekujący' },
  { value: 'confirmed', label: 'Potwierdzony' },
  { value: 'cancelled', label: 'Anulowany' },
];

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  open,
  onClose,
  template,
  eventId,
  onSave,
}) => {
  const isEdit = !!template;
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const subjectRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeField, setActiveField] = useState<'subject' | 'body'>('body');

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: templateToFormValues(template),
  });

  // Reset form when dialog opens with a (possibly new) template
  useEffect(() => {
    if (open) {
      reset(templateToFormValues(template));
      setActiveTab('edit');
      setPreview(null);
    }
  }, [open, template, reset]);

  const triggerType = watch('triggerType');
  const subjectValue = watch('subject');
  const bodyValue = watch('body');
  const scheduleEnabled = watch('scheduleEnabled');

  // Load preview when switching to preview tab
  const handleTabChange = async (tab: string) => {
    const t = tab as 'edit' | 'preview';
    setActiveTab(t);
    if (t === 'preview') {
      setLoadingPreview(true);
      try {
        const res = await previewEmailTemplate({ subject: subjectValue, body: bodyValue });
        if (res.success) setPreview(res.data);
      } finally {
        setLoadingPreview(false);
      }
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const payload: CreateEmailTemplatePayload = {
        eventId: eventId,
        name: values.name,
        subject: values.subject,
        body: values.body,
        triggerType: values.triggerType,
        triggerDaysOffset:
          values.triggerType === 'days_before_event' ||
          values.triggerType === 'days_after_registration'
            ? values.triggerDaysOffset
            : undefined,
        recipientFilter: {
          statuses: values.filterStatuses as Array<'pending' | 'confirmed' | 'cancelled'>,
          paymentStatus: values.filterPaymentStatus,
        },
        active: values.active,
        createdBy: 'current-user', // will be set by server
      };
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Helper: insert variable into currently-active field
  const handleVariableInsert = (newValue: string) => {
    if (activeField === 'subject') {
      setValue('subject', newValue, { shouldValidate: true });
    } else {
      setValue('body', newValue, { shouldValidate: true });
    }
  };

  const currentFieldValue = activeField === 'subject' ? subjectValue : bodyValue;
  const currentFieldRef = activeField === 'subject'
    ? (subjectRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>)
    : (bodyRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {isEdit ? 'Edytuj szablon emaila' : 'Nowy szablon emaila'}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="px-6 pt-3 border-b">
            <TabsList className="mb-0">
              <TabsTrigger value="edit" className="gap-2">
                <FileText className="h-4 w-4" /> Edytor
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" /> Podgląd
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ─── Edit tab ─── */}
          <TabsContent value="edit" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <form id="email-template-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="px-6 py-5 space-y-6">

                  {/* ── Section 1: Basic info ── */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Podstawowe informacje</h3>

                    <div className="space-y-2">
                      <Label htmlFor="tpl-name">Nazwa szablonu <span className="text-destructive">*</span></Label>
                      <Input
                        id="tpl-name"
                        placeholder="np. Potwierdzenie rejestracji"
                        {...register('name')}
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="tpl-subject">
                          Temat emaila <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-xs text-muted-foreground">Kliknij zmienną aby wstawić</span>
                      </div>
                      <Controller
                        name="subject"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="tpl-subject"
                            placeholder="np. Potwierdzenie zapisu na {{wydarzenie.nazwa}}"
                            {...field}
                            ref={(el) => {
                              field.ref(el);
                              (subjectRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                            }}
                            onFocus={() => setActiveField('subject')}
                          />
                        )}
                      />
                      {errors.subject && (
                        <p className="text-xs text-destructive">{errors.subject.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tpl-body">
                        Treść emaila <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="body"
                        control={control}
                        render={({ field }) => (
                          <Textarea
                            id="tpl-body"
                            rows={10}
                            placeholder="Cześć {{uczestnik.imie}}, ..."
                            className="font-mono text-sm resize-y"
                            {...field}
                            ref={(el) => {
                              field.ref(el);
                              (bodyRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
                            }}
                            onFocus={() => setActiveField('body')}
                          />
                        )}
                      />
                      {errors.body && (
                        <p className="text-xs text-destructive">{errors.body.message}</p>
                      )}
                    </div>

                    {/* Variable chips */}
                    <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs font-medium">
                          Zmienne dla pola:{' '}
                          <Badge variant="outline" className="text-xs py-0">
                            {activeField === 'subject' ? 'Temat' : 'Treść'}
                          </Badge>
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              Kliknij zmienną, aby wstawić ją w miejscu kursora w aktywnym polu.
                              Każda zmienna zostanie zastąpiona indywidualnymi danymi odbiorcy przy wysyłce.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <VariableChipsList
                        targetRef={currentFieldRef}
                        onInsert={handleVariableInsert}
                        currentValue={currentFieldValue}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* ── Section 2: Trigger ── */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Wyzwalacz</h3>

                    <Controller
                      name="triggerType"
                      control={control}
                      render={({ field }) => (
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="space-y-2"
                        >
                          {TRIGGER_OPTIONS.map(({ value, label }) => (
                            <div key={value} className="flex items-center gap-3">
                              <RadioGroupItem value={value} id={`trigger-${value}`} />
                              <Label
                                htmlFor={`trigger-${value}`}
                                className="font-normal cursor-pointer flex-1"
                              >
                                {label}
                              </Label>
                              {/* Offset input for day-based triggers */}
                              {field.value === value &&
                                (value === 'days_before_event' ||
                                  value === 'days_after_registration') && (
                                  <Input
                                    type="number"
                                    min={1}
                                    max={365}
                                    className="w-20 h-7 text-sm"
                                    placeholder="dni"
                                    {...register('triggerDaysOffset', { valueAsNumber: true })}
                                  />
                                )}
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    />

                    {/* Schedule panel for manual trigger */}
                    {triggerType === 'manual' && (
                      <div className="ml-6 space-y-3 p-3 rounded-md border bg-muted/20">
                        <div className="flex items-center gap-3">
                          <Controller
                            name="scheduleEnabled"
                            control={control}
                            render={({ field }) => (
                              <Switch
                                id="schedule-switch"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                          <Label htmlFor="schedule-switch" className="font-normal cursor-pointer">
                            Zaplanuj wysyłkę na określoną datę
                          </Label>
                        </div>

                        {scheduleEnabled && (
                          <div className="flex gap-3">
                            <div className="flex-1 space-y-1.5">
                              <Label className="text-xs">Data</Label>
                              <Input type="date" className="h-8" {...register('scheduledDate')} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Godzina</Label>
                              <Input type="time" className="h-8 w-28" {...register('scheduledTime')} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* ── Section 3: Recipients ── */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Odbiorcy</h3>

                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Status rejestracji
                      </Label>
                      <div className="flex flex-wrap gap-4">
                        {REGISTRATION_STATUSES.map(({ value, label }) => (
                          <Controller
                            key={value}
                            name="filterStatuses"
                            control={control}
                            render={({ field }) => (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`status-${value}`}
                                  checked={field.value.includes(value)}
                                  onCheckedChange={(checked) => {
                                    const next = checked
                                      ? [...field.value, value]
                                      : field.value.filter((s) => s !== value);
                                    field.onChange(next);
                                  }}
                                />
                                <Label
                                  htmlFor={`status-${value}`}
                                  className="font-normal cursor-pointer"
                                >
                                  {label}
                                </Label>
                              </div>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Status płatności
                      </Label>
                      <Controller
                        name="filterPaymentStatus"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Wszyscy</SelectItem>
                              <SelectItem value="paid">Tylko opłaceni</SelectItem>
                              <SelectItem value="unpaid">Tylko nieopłaceni</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* ── Active toggle ── */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="tpl-active" className="text-sm font-medium">
                        Aktywny
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Nieaktywne szablony nie są automatycznie wysyłane
                      </p>
                    </div>
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="tpl-active"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                </div>
              </form>
            </ScrollArea>
          </TabsContent>

          {/* ─── Preview tab ─── */}
          <TabsContent value="preview" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="px-6 py-5">
                {loadingPreview ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : preview ? (
                  <div className="space-y-4">
                    <div className="rounded-md border bg-muted/30 p-4 space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                        Temat
                      </p>
                      <p className="font-medium">{preview.subject}</p>
                    </div>
                    <div className="rounded-md border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
                        Treść (przykładowe dane)
                      </p>
                      <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                        {preview.body}
                      </pre>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Powyższy podgląd używa przykładowych danych. Rzeczywista treść będzie różna dla każdego odbiorcy.
                    </p>
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Anuluj
          </Button>
          <Button
            type="submit"
            form="email-template-form"
            disabled={saving}
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Zapisywanie...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> {isEdit ? 'Zapisz zmiany' : 'Utwórz szablon'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
