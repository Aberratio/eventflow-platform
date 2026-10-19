import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Eye, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { previewMailTemplate, saveMailTemplate } from '@/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mailTypeLabel, type MailTemplate, type MailTemplatePreview } from '@/types/email';

interface MailTemplateEditorProps {
  open: boolean;
  template: MailTemplate | null;
  /** Undefined = global (admin) template, otherwise an override for this event. */
  eventId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

/** Edits subject and HTML of one mail type; variables and preview come from the server. */
export const MailTemplateEditor: React.FC<MailTemplateEditorProps> = ({
  open,
  template,
  eventId,
  onClose,
  onSaved,
}) => {
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [preview, setPreview] = useState<MailTemplatePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const mailType = template?.mailType;

  useEffect(() => {
    if (!open || !template) return;
    setSubject(template.subject);
    setBodyHtml(template.bodyHtml);
    setPreview(null);
    setError(null);
    setVariables([]);
    // The allowed variables of this mail type come from the server (keys of the sample map).
    let cancelled = false;
    previewMailTemplate(template.mailType, {}, eventId)
      .then((res) => {
        if (!cancelled) setVariables(Object.keys(res.data.variables ?? {}));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open, template, eventId]);

  const insertVariable = useCallback((name: string) => {
    const token = `{{${name}}}`;
    const el = bodyRef.current;
    setBodyHtml((prev) => {
      const start = el?.selectionStart ?? prev.length;
      const end = el?.selectionEnd ?? prev.length;
      return prev.slice(0, start) + token + prev.slice(end);
    });
  }, []);

  const handlePreview = async () => {
    if (!mailType) return;
    setPreviewing(true);
    setError(null);
    try {
      const res = await previewMailTemplate(mailType, { subject, bodyHtml }, eventId);
      setPreview(res.data);
    } catch (e) {
      setError(errorMessage(e, 'Nie udało się wygenerować podglądu'));
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!mailType) return;
    setSaving(true);
    setError(null);
    try {
      await saveMailTemplate(mailType, { subject, bodyHtml }, eventId);
      toast.success('Szablon zapisany');
      onSaved();
      onClose();
    } catch (e) {
      setError(errorMessage(e, 'Nie udało się zapisać szablonu'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? mailTypeLabel(template.mailType) : 'Szablon'}</DialogTitle>
          <DialogDescription>
            {eventId
              ? 'Zapisanie tworzy nadpisanie szablonu tylko dla tego wydarzenia.'
              : 'Szablon globalny — domyślny dla wszystkich wydarzeń.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mail-subject">Temat</Label>
            <Input
              id="mail-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mail-body">Treść (HTML)</Label>
            <Textarea
              id="mail-body"
              ref={bodyRef}
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Dostępne zmienne</p>
            {variables.length === 0 ? (
              <p className="text-xs text-muted-foreground">Ten szablon nie ma zmiennych.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {variables.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => insertVariable(name)}
                    title={preview?.variables[name] ? `np. ${preview.variables[name]}` : undefined}
                  >
                    <Badge variant="outline" className="cursor-pointer font-mono">
                      {`{{${name}}}`}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {preview && (
            <div className="space-y-2 rounded-md border p-3" data-testid="mail-preview">
              <p className="text-sm">
                <span className="text-muted-foreground">Temat: </span>
                <strong>{preview.subject}</strong>
              </p>
              {preview.unknownVariables.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nieznane zmienne (zapis zostanie odrzucony):{' '}
                    {preview.unknownVariables.map((v) => `{{${v}}}`).join(', ')}
                  </AlertDescription>
                </Alert>
              )}
              <iframe
                title="Podgląd maila"
                sandbox=""
                srcDoc={preview.bodyHtml}
                className="h-64 w-full rounded border bg-white"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Anuluj
          </Button>
          <Button variant="secondary" onClick={handlePreview} disabled={previewing || saving}>
            {previewing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Podgląd
          </Button>
          <Button onClick={handleSave} disabled={saving || !subject.trim() || !bodyHtml.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
