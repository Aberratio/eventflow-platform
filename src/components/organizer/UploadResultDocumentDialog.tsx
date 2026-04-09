import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Distance, ResultClassificationType, EventResultDocument } from '@/types';
import { Upload, FileText } from 'lucide-react';

interface UploadResultDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  distances: Distance[];
  onUpload: (document: Omit<EventResultDocument, 'id' | 'uploadedAt' | 'uploadedBy'>) => void;
}

export const UploadResultDocumentDialog = ({
  open,
  onOpenChange,
  eventId,
  distances,
  onUpload,
}: UploadResultDocumentDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState<ResultClassificationType>('open');
  const [distanceId, setDistanceId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileSelect = () => {
    // Simulate file selection
    setFileName('wyniki.pdf');
    toast({
      title: 'Plik wybrany',
      description: 'wyniki.pdf',
    });
  };

  const handleSubmit = () => {
    if (!name) {
      toast({
        title: 'Błąd',
        description: 'Podaj nazwę dokumentu',
        variant: 'destructive',
      });
      return;
    }

    if (!fileName) {
      toast({
        title: 'Błąd',
        description: 'Wybierz plik PDF',
        variant: 'destructive',
      });
      return;
    }

    const selectedDistance = distances.find((d) => d.id === distanceId);

    onUpload({
      eventId,
      name,
      type,
      distanceId: distanceId || undefined,
      distanceName: selectedDistance?.name,
      fileUrl: `/results/${eventId}-${type}-${Date.now()}.pdf`,
      description: description || undefined,
    });

    // Reset form
    setName('');
    setType('open');
    setDistanceId('');
    setDescription('');
    setFileName('');
    onOpenChange(false);

    toast({
      title: 'Dokument dodany',
      description: `Dokument "${name}" został dodany`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj dokument PDF</DialogTitle>
          <DialogDescription>Prześlij oficjalny dokument z wynikami (PDF)</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File upload area */}
          <div
            className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
            onClick={handleFileSelect}
          >
            {fileName ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                <span className="font-medium">{fileName}</span>
              </div>
            ) : (
              <>
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Kliknij aby wybrać plik PDF</p>
              </>
            )}
          </div>

          {/* Document name */}
          <div className="space-y-2">
            <Label>Nazwa dokumentu</Label>
            <Input
              placeholder="np. Klasyfikacja generalna OPEN"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Document type */}
          <div className="space-y-2">
            <Label>Typ klasyfikacji</Label>
            <Select value={type} onValueChange={(v: ResultClassificationType) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Klasyfikacja OPEN</SelectItem>
                <SelectItem value="category">Kategorie wiekowe</SelectItem>
                <SelectItem value="team">Klasyfikacja drużynowa</SelectItem>
                <SelectItem value="distance">Wyniki dystansu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Distance (optional) */}
          <div className="space-y-2">
            <Label>Dystans (opcjonalnie)</Label>
            <Select value={distanceId} onValueChange={setDistanceId}>
              <SelectTrigger>
                <SelectValue placeholder="Wszystkie dystanse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Wszystkie dystanse</SelectItem>
                {distances.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description (optional) */}
          <div className="space-y-2">
            <Label>Opis (opcjonalnie)</Label>
            <Textarea
              placeholder="Dodatkowe informacje o dokumencie..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit}>
            <Upload className="mr-2 h-4 w-4" />
            Dodaj dokument
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
