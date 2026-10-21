import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-time-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';
import { createDiscountCodeBatch } from '@/api';
import type { DiscountCodeBatchDetail, DiscountCodeBatchInput } from '@/types';
import {
  formatDiscountValue,
  isDiscountInputAllowed,
  parseDiscountValueInput,
} from '@/lib/discountValue';

export const BATCH_MAX_COUNT = 1000;
const PREFIX_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,19}$/;

type DiscountType = 'percent' | 'fixed';

interface GenerateDiscountBatchDialogProps {
  eventId: string;
  onGenerated: (batch: DiscountCodeBatchDetail) => void;
}

/**
 * R-07: "Generuj partię" - one request creates N unique single-purpose codes on the server
 * (POST /events/{id}/discount-code-batches). Validation here only mirrors the server limits
 * so the organizer gets an answer before the round trip; the server stays the authority.
 */
export const GenerateDiscountBatchDialog = ({
  eventId,
  onGenerated,
}: GenerateDiscountBatchDialogProps) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [label, setLabel] = useState('');
  const [count, setCount] = useState('10');
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [valueInput, setValueInput] = useState('10');
  const [maxUses, setMaxUses] = useState('1');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');

  const handleTypeChange = (type: DiscountType) => {
    const parsed = parseDiscountValueInput(valueInput, discountType);
    setValueInput(formatDiscountValue(parsed?.value ?? 10, type));
    setDiscountType(type);
  };

  const handleSubmit = async () => {
    const trimmedPrefix = prefix.trim();
    if (trimmedPrefix && !PREFIX_PATTERN.test(trimmedPrefix)) {
      toast.error('Prefiks: do 20 znaków, litery, cyfry i myślniki');
      return;
    }
    const countNumber = Number(count);
    if (!Number.isInteger(countNumber) || countNumber < 1 || countNumber > BATCH_MAX_COUNT) {
      toast.error(`Liczba kodów musi mieścić się w zakresie 1–${BATCH_MAX_COUNT}`);
      return;
    }
    const parsed = parseDiscountValueInput(valueInput, discountType);
    if (!parsed || parsed.value <= 0 || (discountType === 'percent' && parsed.value > 100)) {
      toast.error(
        discountType === 'fixed'
          ? 'Podaj kwotę rabatu, np. 25,50'
          : 'Podaj wartość rabatu w procentach (1–100)',
      );
      return;
    }
    const maxUsesNumber = Number(maxUses);
    if (!Number.isInteger(maxUsesNumber) || maxUsesNumber < 1) {
      toast.error('Limit użyć na kod musi być liczbą całkowitą (min. 1)');
      return;
    }
    if (validFrom && validTo && validTo < validFrom) {
      toast.error('Data końca ważności nie może być wcześniejsza niż początku');
      return;
    }

    const input: DiscountCodeBatchInput = {
      count: countNumber,
      discountType,
      discountValue: parsed.value,
      maxUses: maxUsesNumber,
      ...(trimmedPrefix && { prefix: trimmedPrefix }),
      ...(label.trim() && { label: label.trim() }),
      ...(validFrom && { validFrom }),
      ...(validTo && { validTo }),
    };

    setSubmitting(true);
    try {
      const response = await createDiscountCodeBatch(eventId, input);
      onGenerated(response.data);
      toast.success(`Wygenerowano ${response.data.codes.length} kodów rabatowych`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się wygenerować partii');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Layers className="mr-2 h-4 w-4" />
          Generuj partię
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generuj partię kodów</DialogTitle>
          <DialogDescription>
            Utwórz wiele unikalnych kodów naraz, np. dla sponsora. Kod z limitem użyć 1 jest
            jednorazowy.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="batch-prefix">Prefiks (opcjonalnie)</Label>
              <Input
                id="batch-prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="np. SPONSOR"
                maxLength={20}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-count">Liczba kodów (1–{BATCH_MAX_COUNT})</Label>
              <Input
                id="batch-count"
                type="number"
                min={1}
                max={BATCH_MAX_COUNT}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch-label">Etykieta partii (opcjonalnie)</Label>
            <Input
              id="batch-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="np. Sponsor Acme"
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="batch-type">Typ zniżki</Label>
              <Select value={discountType} onValueChange={handleTypeChange}>
                <SelectTrigger id="batch-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Procentowa (%)</SelectItem>
                  <SelectItem value="fixed">Kwotowa (PLN)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-value">
                Wartość {discountType === 'fixed' ? '(PLN)' : '(%)'}
              </Label>
              <Input
                id="batch-value"
                type="text"
                inputMode={discountType === 'fixed' ? 'decimal' : 'numeric'}
                value={valueInput}
                onChange={(e) => {
                  if (isDiscountInputAllowed(e.target.value, discountType)) {
                    setValueInput(e.target.value);
                  }
                }}
                placeholder={discountType === 'percent' ? '10' : '50,00'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch-max-uses">Limit użyć na kod</Label>
            <Input
              id="batch-max-uses"
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ważny od (opcjonalnie)</Label>
              <DateInput value={validFrom} onValueChange={setValidFrom} />
            </div>
            <div className="space-y-2">
              <Label>Ważny do (opcjonalnie)</Label>
              <DateInput value={validTo} onValueChange={setValidTo} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Generowanie...' : 'Generuj kody'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
