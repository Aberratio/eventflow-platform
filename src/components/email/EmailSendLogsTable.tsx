import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, XCircle, Clock, Mail } from 'lucide-react';
import type { EmailSendLog } from '@/types/email';

interface EmailSendLogsTableProps {
  logs: EmailSendLog[];
}

const STATUS_CONFIG = {
  sent: {
    icon: CheckCircle2,
    label: 'Wysłany',
    className: 'text-success',
    badgeVariant: 'default' as const,
  },
  failed: {
    icon: XCircle,
    label: 'Błąd',
    className: 'text-destructive',
    badgeVariant: 'destructive' as const,
  },
  scheduled: {
    icon: Clock,
    label: 'Zaplanowany',
    className: 'text-muted-foreground',
    badgeVariant: 'secondary' as const,
  },
};

export const EmailSendLogsTable: React.FC<EmailSendLogsTableProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Mail className="mb-3 h-12 w-12 opacity-30" />
        <p className="text-sm">Brak historii wysyłek</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Odbiorca</TableHead>
            <TableHead>Szablon</TableHead>
            <TableHead className="hidden md:table-cell">Wydarzenie</TableHead>
            <TableHead className="hidden sm:table-cell">Data wysyłki</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const config = STATUS_CONFIG[log.status];
            const StatusIcon = config.icon;
            return (
              <TableRow key={log.id}>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{log.recipientName}</p>
                    <p className="text-xs text-muted-foreground">{log.recipientEmail}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{log.templateName}</p>
                    <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {log.subject}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">{log.eventName ?? '—'}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div>
                    <p className="text-sm">
                      {new Date(log.sentAt).toLocaleDateString('pl-PL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.sentAt).toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {log.scheduledFor && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Zapl.: {new Date(log.scheduledFor).toLocaleDateString('pl-PL')}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={config.badgeVariant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
