import type { DiscountCode, DiscountCodeBatchDetail } from '@/types';

/** Codes of a freshly generated batch as editor rows (real server ids, so a later event save keeps them). */
export const batchToDiscountCodes = (batch: DiscountCodeBatchDetail): DiscountCode[] =>
  batch.codes.map((code) => ({
    id: code.id,
    code: code.code,
    discountType: batch.discountType,
    discountValue: batch.discountValue,
    validFrom: batch.validFrom ?? undefined,
    validTo: batch.validTo ?? undefined,
    maxUses: batch.maxUses,
    usedCount: code.usedCount,
    active: code.active,
    batchId: batch.id,
  }));
