import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, Lock, Mail, Pencil, RotateCcw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getMailTemplates, resetMailTemplate } from '@/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MAIL_SOURCE_LABELS,
  mailTypeLabel,
  type EmailTemplateScope,
  type MailTemplate,
} from '@/types/email';
import { MailTemplateEditor } from './MailTemplateEditor';
import { MailLogTable } from './MailLogTable';

interface EmailTemplatesManagerProps {
  /** Required for scope 'event'. */
  eventId?: string;
  /** Read-only view (no edit/revert). */
  readonly?: boolean;
  /** 'event' = per-event overrides; 'system' = global templates (admin). */
  scope?: EmailTemplateScope;
}

/**
 * Mail templates of the server catalogue: authentication mails are editable only globally,
 * the rest can be overridden per event and reverted to the default.
 */
export const EmailTemplatesManager: React.FC<EmailTemplatesManagerProps> = ({
  eventId,
  readonly = false,
  scope = 'event',
}) => {
  const templatesEventId = scope === 'event' ? eventId : undefined;
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MailTemplate | null>(null);
  const [reverting, setReverting] = useState<MailTemplate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMailTemplates(templatesEventId);
      setTemplates(res.data);
    } catch {
      setError('Nie udało się załadować szablonów');
    } finally {
      setLoading(false);
    }
  }, [templatesEventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmRevert = async () => {
    if (!reverting || !templatesEventId) return;
    try {
      await resetMailTemplate(reverting.mailType, templatesEventId);
      toast.success('Przywrócono domyślny szablon');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Nie udało się przywrócić szablonu');
    } finally {
      setReverting(null);
    }
  };

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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Szablony e-maili</h2>
        <p className="text-sm text-muted-foreground">
          {scope === 'system'
            ? 'Globalne szablony wszystkich maili platformy. Organizatorzy mogą nadpisać część z nich dla swojego wydarzenia.'
            : 'Maile wysyłane dla tego wydarzenia. Możesz nadpisać treść i wrócić do domyślnej.'}
        </p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            Szablony ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Send className="h-4 w-4" />
            Dziennik wysyłek
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          <ul className="divide-y rounded-md border">
            {templates.map((template) => {
              const locked = scope === 'event' && !template.overridable;
              return (
                <li
                  key={template.mailType}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{mailTypeLabel(template.mailType)}</p>
                    <p className="truncate text-sm text-muted-foreground">{template.subject}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="outline">{MAIL_SOURCE_LABELS[template.source]}</Badge>
                      {locked && (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Tylko globalnie
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!readonly && !locked && (
                    <div className="flex gap-2">
                      {scope === 'event' && template.source === 'event_override' && (
                        <Button variant="outline" size="sm" onClick={() => setReverting(template)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Przywróć domyślny
                        </Button>
                      )}
                      <Button size="sm" onClick={() => setEditing(template)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edytuj
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <MailLogTable eventId={templatesEventId} />
        </TabsContent>
      </Tabs>

      <MailTemplateEditor
        open={editing !== null}
        template={editing}
        eventId={templatesEventId}
        onClose={() => setEditing(null)}
        onSaved={() => void load()}
      />

      <AlertDialog open={reverting !== null} onOpenChange={(o) => !o && setReverting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Przywrócić domyślny szablon?</AlertDialogTitle>
            <AlertDialogDescription>
              Nadpisanie „{reverting ? mailTypeLabel(reverting.mailType) : ''}" zostanie usunięte —
              to wydarzenie będzie używać szablonu globalnego.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmRevert()}>Przywróć</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
