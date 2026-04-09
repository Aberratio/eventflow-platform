import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  Calendar,
} from 'lucide-react';
import type { EmailTemplate } from '@/types/email';
import { EMAIL_TRIGGER_LABELS } from '@/types/email';
import { useState } from 'react';

interface EmailTemplateCardProps {
  template: EmailTemplate;
  readonly?: boolean;
  onEdit: (template: EmailTemplate) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onSendNow: (template: EmailTemplate) => void;
}

const TRIGGER_ICONS: Record<string, React.ElementType> = {
  on_registration: CheckCircle2,
  on_payment_confirmed: CheckCircle2,
  on_registration_cancelled: XCircle,
  on_event_approved: CheckCircle2,
  on_bib_assigned: Zap,
  days_before_event: Clock,
  days_after_registration: Clock,
  manual: Calendar,
};

function getTriggerLabel(template: EmailTemplate): string {
  const base = EMAIL_TRIGGER_LABELS[template.triggerType];
  if (
    (template.triggerType === 'days_before_event' ||
      template.triggerType === 'days_after_registration') &&
    template.triggerDaysOffset !== undefined
  ) {
    return `${template.triggerDaysOffset} ${base.toLowerCase()}`;
  }
  return base;
}

export const EmailTemplateCard: React.FC<EmailTemplateCardProps> = ({
  template,
  readonly = false,
  onEdit,
  onDelete,
  onToggle,
  onSendNow,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const TriggerIcon = TRIGGER_ICONS[template.triggerType] ?? Zap;

  return (
    <>
      <Card className={`transition-opacity ${template.active ? '' : 'opacity-60'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold">{template.name}</h3>
                {template.eventId ? (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    Wydarzenie
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    Globalny
                  </Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{template.subject}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {!readonly && (
                <Switch
                  checked={template.active}
                  onCheckedChange={(checked) => onToggle(template.id, checked)}
                  aria-label="Włącz/wyłącz szablon"
                />
              )}
              {!readonly && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(template)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edytuj
                    </DropdownMenuItem>
                    {template.triggerType === 'manual' && (
                      <DropdownMenuItem onClick={() => onSendNow(template)}>
                        <Send className="mr-2 h-4 w-4" /> Wyślij teraz
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Usuń
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {/* Trigger */}
            <div className="flex items-center gap-1">
              <TriggerIcon className="h-3.5 w-3.5" />
              <span>{getTriggerLabel(template)}</span>
            </div>

            {/* Sent count */}
            <div className="flex items-center gap-1">
              <Send className="h-3.5 w-3.5" />
              <span>{template.sentCount} wysłanych</span>
            </div>

            {/* Last sent */}
            {template.lastSentAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {new Date(template.lastSentAt).toLocaleDateString('pl-PL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}

            {/* Recipient filter summary */}
            {template.recipientFilter.paymentStatus &&
              template.recipientFilter.paymentStatus !== 'all' && (
                <Badge variant="outline" className="py-0 text-xs">
                  {template.recipientFilter.paymentStatus === 'paid' ? 'Opłaceni' : 'Nieopłaceni'}
                </Badge>
              )}
          </div>

          {/* Quick action for manual templates */}
          {template.triggerType === 'manual' && !readonly && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => onSendNow(template)}
            >
              <Send className="mr-2 h-3.5 w-3.5" />
              Wyślij teraz
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń szablon emaila</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć szablon <strong>„{template.name}"</strong>? Tej operacji
              nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(template.id);
                setShowDeleteDialog(false);
              }}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
