import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { EventResultDocument } from '@/types';

interface ResultDocumentsCardProps {
  documents: EventResultDocument[];
  onUpload: () => void;
  onDelete: (docId: string) => void;
  canUpload?: boolean;
}

export const ResultDocumentsCard: React.FC<ResultDocumentsCardProps> = ({
  documents,
  onUpload,
  onDelete,
  canUpload = true,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        Dokumenty PDF z wynikami
      </CardTitle>
      <Button onClick={onUpload} disabled={!canUpload}>
        <Upload className="mr-2 h-4 w-4" />
        Dodaj dokument
      </Button>
    </CardHeader>
    <CardContent>
      {documents.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>Brak dokumentów PDF.</p>
          <Button className="mt-4" onClick={onUpload} disabled={!canUpload}>
            <Upload className="mr-2 h-4 w-4" />
            Dodaj pierwszy dokument
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-medium">{doc.name}</h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {doc.type === 'open'
                        ? 'OPEN'
                        : doc.type === 'team'
                          ? 'Drużynowa'
                          : doc.type === 'category'
                            ? 'Kategorie'
                            : 'Dystans'}
                    </Badge>
                    {doc.distanceName && (
                      <span className="text-xs text-muted-foreground">{doc.distanceName}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      • {format(new Date(doc.uploadedAt), 'd MMM yyyy', { locale: pl })}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onDelete(doc.id)} disabled={!canUpload}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
