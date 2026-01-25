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
    // In a real app, this would trigger a download
    window.open(doc.fileUrl, '_blank');
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
              className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  {getTypeIcon(doc.type)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(doc.type)}
                    </Badge>
                    {doc.distanceName && (
                      <span className="text-xs text-muted-foreground">
                        {doc.distanceName}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      • {format(new Date(doc.uploadedAt), 'd MMM yyyy', { locale: pl })}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Podgląd</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                >
                  <Download className="h-4 w-4 mr-1" />
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
