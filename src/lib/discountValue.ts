import type { PriceTierDiscountType } from '@/types';

export const roundToCents = (value: number): number => Math.round(value * 100) / 100;

export const formatDiscountValue = (
  value: number | string | null | undefined,
  type: PriceTierDiscountType,
): string => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return type === 'fixed' ? '0,00' : '0';
  if (type === 'fixed') {
    return amount.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return String(amount);
};

export const formatDiscountBadge = (
  value: number | string | null | undefined,
  type: PriceTierDiscountType,
): string => {
  if (type === 'fixed') return `${formatDiscountValue(value, type)} zł`;
  return `${formatDiscountValue(value, type)}%`;
};

export const parseDiscountValueInput = (
  input: string,
  type: PriceTierDiscountType,
): { value: number; normalized: string } | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const pattern = type === 'fixed' ? /^\d+(?:[,.]\d{0,2})?$/ : /^\d+$/;
  if (!pattern.test(trimmed)) return null;

  const normalized = trimmed.replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;

  return {
    value: type === 'fixed' ? roundToCents(parsed) : parsed,
    normalized,
  };
};

export const isDiscountInputAllowed = (input: string, type: PriceTierDiscountType): boolean => {
  if (!input.trim()) return true;
  return type === 'fixed' ? /^\d+(?:[,.]\d{0,2})?$/.test(input.trim()) : /^\d+$/.test(input.trim());
};
