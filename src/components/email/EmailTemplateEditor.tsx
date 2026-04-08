import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Eye, FileText, HelpCircle, Loader2, Save } from 'lucide-react';
import type {
  EmailTemplate, EmailTriggerType, CreateEmailTemplatePayload, EmailTemplateScope,
} from '@/types/email';
import { VariableChipsList } from './VariableChipsList';
import { EmailPreviewPane } from './EmailPreviewPane';
import { EmailTriggerSection } from './EmailTriggerSection';
import { EmailRecipientsSection } from './EmailRecipientsSection';
import { previewEmailTemplate } from '@/api/email-templates.api';

const schema = z.object({
  name: z.string().trim().min(1, 'Podaj nazwę szablonu').max(120),
  subject: z.string().trim().min(1, 'Podaj temat emaila').max(200),
  body: z.string().trim().min(10, 'Treść musi mieć co najmniej 10 znaków').max(10_000),
  triggerType: z.string(),
  triggerDaysOffset: z.number().min(1).max(365).optional(),
  active: z.boolean(),
  filterStatuses: z.array(z.string()),
  filterPaymentStatus: z.enum(['all', 'paid', 'unpaid']),
  scheduleEnabled: z.boolean(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function templateToFormValues(t: EmailTemplate | undefined, scope: EmailTemplateScope): FormValues {
  const defaultTrigger = scope === 'system' ? 'on_account_created' : 'on_registration';
  return {
    name: t?.name ?? '', subject: t?.subject ?? '', body: t?.body ?? '',
    triggerType: t?.triggerType ?? defaultTrigger,
    triggerDaysOffset: t?.triggerDaysOffset, active: t?.active ?? true,
    filterStatuses: t?.recipientFilter?.statuses ?? ['pending', 'confirmed'],
    filterPaymentStatus: t?.recipientFilter?.paymentStatus ?? 'all',
    scheduleEnabled: false, scheduledDate: '', scheduledTime: '08:00',
  };
}

interface EmailTemplateEditorProps {
  open: boolean;
  onClose: () => void;
  template?: EmailTemplate;
  eventId?: string;
  scope?: EmailTemplateScope;
  onSave: (payload: CreateEmailTemplatePayload) => Promise<void>;
}

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  open, onClose, template, eventId, scope = 'event', onSave,
}) => {
  const isEvent = scope === 'event';
  const isEdit = !!template;
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const subjectRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeField, setActiveField] = useState<'subject' | 'body'>('body');

  const {
    register, control, watch, setValue, handleSubmit, reset, formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: templateToFormValues(template, scope),
  });

  useEffect(() => {
    if (open) {
      reset(templateToFormValues(template, scope));
      setActiveTab('edit'); setPreview(null);
    }
  }, [open, template, reset, scope]);

  const triggerType = watch('triggerType');
  const subjectValue = watch('subject');
  const bodyValue = watch('body');
  const scheduleEnabled = watch('scheduleEnabled');

  const handleTabChange = async (tab: string) => {
    const t = tab as 'edit' | 'preview';
    setActiveTab(t);
    if (t === 'preview') {
      setLoadingPreview(true);
      try {
        const res = await previewEmailTemplate({ subject: subjectValue, body: bodyValue });
        if (res.success) setPreview(res.data);
      } finally { setLoadingPreview(false); }
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const payload: CreateEmailTemplatePayload = {
        eventId: isEvent ? eventId : undefined,
        name: values.name, subject: values.subject, body: values.body,
        triggerType: values.triggerType as EmailTriggerType,
        triggerDaysOffset:
          values.triggerType === 'days_before_event' || values.triggerType === 'days_after_registration'
            ? values.triggerDaysOffset : undefined,
        recipientFilter: isEvent
          ? { statuses: values.filterStatuses as Array<'pending' | 'confirmed' | 'cancelled'>, paymentStatus: values.filterPaymentStatus }
          : {},
        active: values.active, createdBy: 'current-user',
      };
      await onSave(payload);
      onClose();
    } finally { setSaving(false); }
  };

  const handleVariableInsert = (newValue: string) => {
    setValue(activeField === 'subject' ? 'subject' : 'body', newValue, { shouldValidate: true });
  };

  const currentFieldValue = activeField === 'subject' ? subjectValue : bodyValue;
  const currentFieldRef = activeField === 'subject'
    ? (subjectRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>)
    : (bodyRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{isEdit ? 'Edytuj szablon emaila' : 'Nowy szablon emaila'}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 pt-3 border-b">
            <TabsList className="mb-0">
              <TabsTrigger value="edit" className="gap-2"><FileText className="h-4 w-4" /> Edytor</TabsTrigger>
              <TabsTrigger value="preview" className="gap-2"><Eye className="h-4 w-4" /> Podgląd</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="edit" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <form id="email-template-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="px-6 py-5 space-y-6">
                  {/* Basic info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Podstawowe informacje</h3>
                    <div className="space-y-2">
                      <Label htmlFor="tpl-name">Nazwa szablonu <span className="text-destructive">*</span></Label>
                      <Input id="tpl-name" placeholder="np. Potwierdzenie rejestracji" {...register('name')} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="tpl-subject">Temat emaila <span className="text-destructive">*</span></Label>
                        <span className="text-xs text-muted-foreground">Kliknij zmienną aby wstawić</span>
                      </div>
                      <Controller name="subject" control={control} render={({ field }) => (
                        <Input id="tpl-subject" placeholder="np. Potwierdzenie zapisu na {{wydarzenie.nazwa}}" {...field}
                          ref={(el) => { field.ref(el); (subjectRef as React.MutableRefObject<HTMLInputElement | null>).current = el; }}
                          onFocus={() => setActiveField('subject')}
                        />
                      )} />
                      {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tpl-body">Treść emaila <span className="text-destructive">*</span></Label>
                      <Controller name="body" control={control} render={({ field }) => (
                        <Textarea id="tpl-body" rows={10} placeholder="Cześć {{uczestnik.imie}}, ..." className="font-mono text-sm resize-y" {...field}
                          ref={(el) => { field.ref(el); (bodyRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el; }}
                          onFocus={() => setActiveField('body')}
                        />
                      )} />
                      {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
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
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <VariableChipsList targetRef={currentFieldRef} onInsert={handleVariableInsert} currentValue={currentFieldValue} scope={scope} />
                    </div>
                  </div>

                  <Separator />
                  <EmailTriggerSection scope={scope} control={control} register={register} triggerType={triggerType} scheduleEnabled={scheduleEnabled} />

                  {isEvent && (
                    <>
                      <Separator />
                      <EmailRecipientsSection control={control} />
                    </>
                  )}

                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="tpl-active" className="text-sm font-medium">Aktywny</Label>
                      <p className="text-xs text-muted-foreground">Nieaktywne szablony nie są automatycznie wysyłane</p>
                    </div>
                    <Controller name="active" control={control} render={({ field }) => (
                      <Switch id="tpl-active" checked={field.value} onCheckedChange={field.onChange} />
                    )} />
                  </div>
                </div>
              </form>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 min-h-0 mt-0">
            <EmailPreviewPane loading={loadingPreview} preview={preview} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>Anuluj</Button>
          <Button type="submit" form="email-template-form" disabled={saving}>
            {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Zapisywanie...</>) : (<><Save className="h-4 w-4 mr-2" /> {isEdit ? 'Zapisz zmiany' : 'Utwórz szablon'}</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
