import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmailPreviewPaneProps {
  loading: boolean;
  preview: { subject: string; body: string } | null;
}

export const EmailPreviewPane: React.FC<EmailPreviewPaneProps> = ({ loading, preview }) => {
  return (
    <ScrollArea className="h-full">
      <div className="px-6 py-5">
        {loading ? (
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
  );
};
