import { Registration } from '@/types';

/**
 * Get available (free) bib numbers as formatted string
 * @param registrations - All registrations to check
 * @param maxToShow - Maximum ranges to show before adding "i więcej"
 * @returns Formatted string like "1-5, 7-10, 12 i więcej"
 */
export const getAvailableNumbersString = (registrations: Registration[], maxToShow = 3): string => {
  // Collect all used numbers
  const usedNumbers = registrations
    .filter((r) => r.bibNumber)
    .map((r) => parseInt(r.bibNumber!, 10))
    .filter((n) => !isNaN(n) && n > 0)
    .sort((a, b) => a - b);

  if (usedNumbers.length === 0) {
    return '1 i więcej';
  }

  const maxUsed = Math.max(...usedNumbers);
  const usedSet = new Set(usedNumbers);

  // Find free ranges from 1 to maxUsed + 20
  const ranges: { start: number; end: number }[] = [];
  let rangeStart: number | null = null;

  for (let i = 1; i <= maxUsed + 20; i++) {
    if (!usedSet.has(i)) {
      if (rangeStart === null) {
        rangeStart = i;
      }
    } else {
      if (rangeStart !== null) {
        ranges.push({ start: rangeStart, end: i - 1 });
        rangeStart = null;
      }
    }
  }

  // Handle trailing range
  if (rangeStart !== null) {
    ranges.push({ start: rangeStart, end: maxUsed + 20 });
  }

  // If no gaps found, just show "maxUsed+1 i więcej"
  if (ranges.length === 0) {
    return `${maxUsed + 1} i więcej`;
  }

  // Format ranges
  const formatRange = (range: { start: number; end: number }, isLast: boolean) => {
    if (isLast && range.end >= maxUsed + 10) {
      if (range.start === range.end) {
        return `${range.start} i więcej`;
      }
      return `${range.start} i więcej`;
    }
    if (range.start === range.end) {
      return `${range.start}`;
    }
    return `${range.start}-${range.end}`;
  };

  const displayRanges = ranges.slice(0, maxToShow);
  const formatted = displayRanges.map((r, i) => formatRange(r, i === displayRanges.length - 1));

  if (ranges.length > maxToShow) {
    return `${formatted.slice(0, -1).join(', ')} i więcej`;
  }

  return formatted.join(', ');
};

/**
 * Get the next available bib number
 * @param registrations - All registrations to check
 * @param startFrom - Minimum number to start from
 * @returns Next available number
 */
export const getNextAvailableNumber = (registrations: Registration[], startFrom = 1): number => {
  const usedNumbers = new Set(
    registrations
      .filter((r) => r.bibNumber)
      .map((r) => parseInt(r.bibNumber!, 10))
      .filter((n) => !isNaN(n)),
  );

  let current = startFrom;
  while (usedNumbers.has(current)) {
    current++;
  }
  return current;
};

/**
 * Check if a bib number is already taken
 * @param registrations - All registrations to check
 * @param bibNumber - Number to check
 * @param excludeRegistrationId - Registration ID to exclude (for editing existing)
 * @returns True if number is taken
 */
export const isBibNumberTaken = (
  registrations: Registration[],
  bibNumber: string,
  excludeRegistrationId?: string,
): boolean => {
  const num = parseInt(bibNumber, 10);
  if (isNaN(num)) return false;

  return registrations.some((r) => {
    if (r.id === excludeRegistrationId) return false;
    if (!r.bibNumber) return false;
    return parseInt(r.bibNumber, 10) === num;
  });
};

/** R-13: a distance's start number range as typed in the event form (blank string = empty). */
export interface BibRangeInput {
  name?: string;
  bibRangeFrom: string;
  bibRangeTo: string;
}

const parseRangeBound = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isInteger(n) ? n : Number.NaN;
};

/**
 * R-13: field errors (`distance_<i>_bibRangeFrom` / `_bibRangeTo`) for the start number ranges of
 * one event: both bounds or none, 1 <= from <= to, and no overlap with an earlier distance.
 * Mirrors the server's validation so the organizer sees the problem before saving.
 */
export const bibRangeFieldErrors = (
  distances: BibRangeInput[],
  index: number,
): Record<string, string> => {
  const dist = distances[index];
  const from = parseRangeBound(dist.bibRangeFrom);
  const to = parseRangeBound(dist.bibRangeTo);
  if (from === null && to === null) return {};
  if (from === null) {
    return { [`distance_${index}_bibRangeFrom`]: 'Podaj początek zakresu numerów' };
  }
  if (to === null) {
    return { [`distance_${index}_bibRangeTo`]: 'Podaj koniec zakresu numerów' };
  }
  if (Number.isNaN(from) || Number.isNaN(to) || from < 1 || to < from) {
    return {
      [`distance_${index}_bibRangeTo`]:
        'Zakres musi składać się z liczb całkowitych: od co najmniej 1, a „do” nie mniejsze niż „od”',
    };
  }
  for (let i = 0; i < index; i++) {
    const otherFrom = parseRangeBound(distances[i].bibRangeFrom);
    const otherTo = parseRangeBound(distances[i].bibRangeTo);
    if (
      otherFrom === null ||
      otherTo === null ||
      Number.isNaN(otherFrom) ||
      Number.isNaN(otherTo)
    ) {
      continue;
    }
    if (from <= otherTo && to >= otherFrom) {
      return {
        [`distance_${index}_bibRangeFrom`]: `Zakres ${from}–${to} nachodzi na zakres dystansu „${
          distances[i].name || `#${i + 1}`
        }” (${otherFrom}–${otherTo})`,
      };
    }
  }
  return {};
};
