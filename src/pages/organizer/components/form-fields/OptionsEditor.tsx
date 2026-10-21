import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DraftOption } from '@/lib/formFields';

/** Variant rows (name + signed price) shared by the create and the edit dialog. */
export const OptionsEditor = ({
  options,
  setOptions,
}: {
  options: DraftOption[];
  setOptions: (updater: (prev: DraftOption[]) => DraftOption[]) => void;
}) => (
  <div className="space-y-2">
    <Label>Warianty</Label>
    <p className="text-xs text-muted-foreground">
      Cena wariantu jest opcjonalna i może być ujemna (np. -5 przy rezygnacji z losowania).
    </p>
    {options.map((option, index) => (
      <div key={index} className="flex gap-2">
        <Input
          aria-label={`Wariant ${index + 1}`}
          placeholder="Nazwa wariantu"
          value={option.label}
          onChange={(e) =>
            setOptions((prev) =>
              prev.map((o, i) => (i === index ? { ...o, label: e.target.value } : o)),
            )
          }
        />
        <Input
          aria-label={`Cena wariantu ${index + 1}`}
          placeholder="Cena, zł"
          type="number"
          step="0.01"
          className="w-32"
          value={option.price}
          onChange={(e) =>
            setOptions((prev) =>
              prev.map((o, i) => (i === index ? { ...o, price: e.target.value } : o)),
            )
          }
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Usuń wariant ${index + 1}`}
          disabled={options.length === 1}
          onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ))}
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setOptions((prev) => [...prev, { label: '', price: '' }])}
    >
      <Plus className="mr-2 h-4 w-4" /> Dodaj wariant
    </Button>
  </div>
);
