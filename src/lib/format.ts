/**
 * Shared formatting helpers used across the app.
 *
 * Money is shown in the pl-PL standard: comma as the decimal separator, a
 * space as the thousands separator and a "zł" suffix.
 */
export function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '0,00 zł';
  return `${amount.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} zł`;
}

/** Amount in grosze (integer from the API, e.g. the settlement report) -> "123,45 zł". */
export function formatMinorMoney(minor: number): string {
  return formatMoney(minor / 100);
}

/**
 * Formats a date (no time) in the local pl-PL standard, the same as the
 * `new Date(x).toLocaleDateString('pl-PL')` calls it replaced. It takes no
 * options and adds no time; callers that need another format (with time, a
 * long month name, an explicit `day: '2-digit'`) format dates themselves.
 */
export function formatDate(date: string | number | Date): string {
  return new Date(date).toLocaleDateString('pl-PL');
}

/** Local calendar date as "YYYY-MM-DD" (no timezone shift, unlike `toISOString`). */
export function toIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * A duration in seconds as "H:MM:SS", rounded to a whole second. With
 * `hours: 'auto'` the hour part is left out under one hour ("M:SS").
 */
export function formatDuration(
  totalSeconds: number,
  { hours = 'always' }: { hours?: 'always' | 'auto' } = {},
): string {
  const whole = Math.round(totalSeconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = String(whole % 60).padStart(2, '0');
  if (h === 0 && hours === 'auto') return `${m}:${s}`;
  return `${h}:${String(m).padStart(2, '0')}:${s}`;
}

/**
 * Average pace as "M:SS min/km". The pace is rounded to a whole second first,
 * so 4:59.6 becomes "5:00", never "4:60".
 */
export function formatPace(timeInSeconds: number, distanceKm: number): string {
  const pace = Math.round(timeInSeconds / distanceKm);
  const s = String(pace % 60).padStart(2, '0');
  return `${Math.floor(pace / 60)}:${s} min/km`;
}
