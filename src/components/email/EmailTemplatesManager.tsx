import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Mail, Loader2, AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import type {
  EmailTemplate,
  EmailSendLog,
  CreateEmailTemplatePayload,
  EmailTemplateScope,
} from '@/types/email';
import {
  getEmailTemplates,
  getEmailSendLogs,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  toggleEmailTemplate,
  sendEmailNow,
} from '@/api/email-templates.api';
import { EmailTemplateCard } from './EmailTemplateCard';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import { EmailSendLogsTable } from './EmailSendLogsTable';

interface EmailTemplatesManagerProps {
  /** If provided, shows templates for this specific event. Omit for global (admin) view. */
  eventId?: string;
  /** When true, only shows read-only view (no create/edit/delete/send). For moderators. */
  readonly?: boolean;
  /** Scope: 'event' for per-event templates, 'system' for global/admin templates */
  scope?: EmailTemplateScope;
}

interface SendConfirmDialogState {
  open: boolean;
  template: EmailTemplate | null;
}

export const EmailTemplatesManager: React.FC<EmailTemplatesManagerProps> = ({
  eventId,
  readonly = false,
  scope = 'event',
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailSendLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | undefined>(undefined);
  const [sendDialog, setSendDialog] = useState<SendConfirmDialogState>({
    open: false,
    template: null,
  });
  const [sending, setSending] = useState(false);

  // ── Load data ──
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryId = scope === 'system' ? null : (eventId ?? undefined);
      const res = await getEmailTemplates(queryId);
      setTemplates(res.data);
    } catch {
      setError('Nie udało się załadować szablonów');
    } finally {
      setLoading(false);
    }
  }, [eventId, scope]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await getEmailSendLogs(eventId);
      setLogs(res.data);
    } finally {
      setLogsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // ── Handlers ──
  const handleOpenCreate = () => {
    setEditingTemplate(undefined);
    setEditorOpen(true);
  };

  const handleOpenEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleSave = async (payload: CreateEmailTemplatePayload) => {
    if (editingTemplate) {
      const res = await updateEmailTemplate(editingTemplate.id, payload);
      if (res.success) {
        toast.success('Szablon zaktualizowany');
        loadTemplates();
      } else {
        toast.error(res.message ?? 'Błąd podczas zapisywania');
      }
    } else {
      const res = await createEmailTemplate(payload);
      if (res.success) {
        toast.success('Szablon utworzony');
        loadTemplates();
      } else {
        toast.error(res.message ?? 'Błąd podczas tworzenia szablonu');
      }
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteEmailTemplate(id);
    if (res.success) {
      toast.success('Szablon usunięty');
      loadTemplates();
    } else {
      toast.error(res.message ?? 'Błąd podczas usuwania');
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    const res = await toggleEmailTemplate(id, active);
    if (res.success) {
      toast.success(active ? 'Szablon aktywowany' : 'Szablon dezaktywowany');
      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, active } : t)));
    } else {
      toast.error('Błąd podczas zmiany statusu');
    }
  };

  const handleSendNow = (template: EmailTemplate) => {
    setSendDialog({ open: true, template });
  };

  const confirmSend = async () => {
    if (!sendDialog.template) return;
    setSending(true);
    try {
      const res = await sendEmailNow(sendDialog.template.id);
      if (res.success) {
        toast.success(res.message ?? `Wysłano do ${res.data.sent} odbiorców`);
        loadTemplates();
        loadLogs();
      } else {
        toast.error(res.message ?? 'Błąd podczas wysyłki');
      }
    } finally {
      setSending(false);
      setSendDialog({ open: false, template: null });
    }
  };

  // ── Render ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Szablony emaili</h2>
            <p className="text-sm text-muted-foreground">
              {scope === 'system'
                ? 'Szablony emaili systemowych (rejestracja konta, reset hasła itp.)'
                : eventId
                  ? 'Automatyczne i ręczne emaile dla tego wydarzenia'
                  : 'Globalne szablony emaili platformy'}
            </p>
          </div>
          {!readonly && (
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nowy szablon
            </Button>
          )}
        </div>

        {/* Tabs: Templates list / Send logs */}
        <Tabs defaultValue="templates" onValueChange={(v) => v === 'logs' && loadLogs()}>
          <TabsList>
            <TabsTrigger value="templates" className="gap-2">
              <Mail className="h-4 w-4" />
              Szablony ({templates.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Send className="h-4 w-4" />
              Historia wysyłek
            </TabsTrigger>
          </TabsList>

          {/* ── Templates list ── */}
          <TabsContent value="templates" className="mt-4">
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-16 text-muted-foreground">
                <Mail className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-sm font-medium">Brak szablonów emaili</p>
                {!readonly && (
                  <Button variant="link" className="mt-2 text-primary" onClick={handleOpenCreate}>
                    Utwórz pierwszy szablon
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {templates.map((template) => (
                  <EmailTemplateCard
                    key={template.id}
                    template={template}
                    readonly={readonly}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onSendNow={handleSendNow}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Send logs ── */}
          <TabsContent value="logs" className="mt-4">
            {logsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <EmailSendLogsTable logs={logs} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Editor dialog */}
      <EmailTemplateEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        template={editingTemplate}
        eventId={eventId}
        scope={scope}
        onSave={handleSave}
      />

      {/* Send confirmation dialog */}
      <Dialog
        open={sendDialog.open}
        onOpenChange={(o) => !o && setSendDialog({ open: false, template: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wyślij email do uczestników</DialogTitle>
            <DialogDescription>
              Szablon <strong>„{sendDialog.template?.name}"</strong> zostanie wysłany teraz do
              wszystkich uczestników spełniających kryteria filtrów.
              {sendDialog.template?.recipientFilter?.paymentStatus === 'unpaid' && (
                <span className="mt-1 block text-muted-foreground">
                  Dotyczy: tylko nieopłaceni uczestnicy.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendDialog({ open: false, template: null })}
              disabled={sending}
            >
              Anuluj
            </Button>
            <Button onClick={confirmSend} disabled={sending} className="gap-2">
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Wyślij teraz
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
