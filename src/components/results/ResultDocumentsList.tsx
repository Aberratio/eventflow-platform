import { safeUrl } from '@/lib/safeUrl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Trophy, Users, BarChart3 } from 'lucide-react';
import { EventResultDocument, ResultClassificationType } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ResultDocumentsListProps {
  documents: EventResultDocument[];
  showHeader?: boolean;
}

const getTypeIcon = (type: ResultClassificationType) => {
  switch (type) {
    case 'open':
      return <Trophy className="h-4 w-4" />;
    case 'team':
      return <Users className="h-4 w-4" />;
    case 'category':
      return <BarChart3 className="h-4 w-4" />;
    case 'distance':
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: ResultClassificationType) => {
  switch (type) {
    case 'open':
      return 'OPEN';
    case 'team':
      return 'Drużynowa';
    case 'category':
      return 'Kategorie';
    case 'distance':
      return 'Dystans';
    default:
      return type;
  }
};

export const ResultDocumentsList = ({ documents, showHeader = true }: ResultDocumentsListProps) => {
  if (documents.length === 0) return null;

  const handleDownload = (doc: EventResultDocument) => {
    const href = safeUrl(doc.fileUrl);
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Dokumenty do pobrania
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showHeader ? '' : 'pt-6'}>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
                  {getTypeIcon(doc.type)}
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-medium">{doc.name}</h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(doc.type)}
                    </Badge>
                    {doc.distanceName && (
                      <span className="text-xs text-muted-foreground">{doc.distanceName}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      • {format(new Date(doc.uploadedAt), 'd MMM yyyy', { locale: pl })}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                  <Eye className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Podgląd</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                  <Download className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
