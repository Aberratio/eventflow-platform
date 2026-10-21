/**
 * Współdzielone funkcje formatujące używane w całej aplikacji.
 *
 * TD.21: ujednolicony standard wyświetlania kwot pieniężnych to
 * pl-PL (przecinek jako separator dziesiętny, spacja jako separator
 * tysięcy) z sufiksem "zł" — tak jak już robił (częściowo przyjęty)
 * `formatMoney`. Wcześniejsze rozproszone `.toFixed(2)` (z kropką i
 * bez grupowania tysięcy) oraz sufiks "PLN" w części miejsc były
 * niespójne z tym standardem i zostały ujednolicone w ramach TD.21.
 */
export function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '0,00 zł';
  return `${amount.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} zł`;
}

/** Kwota w groszach (int z API, np. raport rozliczeniowy) -> "123,45 zł". */
export function formatMinorMoney(minor: number): string {
  return formatMoney(minor / 100);
}

/**
 * Formatuje datę (bez godziny) zgodnie z lokalnym standardem pl-PL,
 * identycznie jak rozproszone wcześniej wywołania
 * `new Date(x).toLocaleDateString('pl-PL')` (TD.21). Celowo nie
 * przyjmuje opcji ani nie dodaje godziny/minuty — miejsca, które
 * potrzebują innego formatu (np. z godziną, z długą nazwą miesiąca,
 * czy z jawnym `day: '2-digit'`), zostały w TD.21 świadomie
 * pozostawione bez zmian jako odrębny przypadek formatowania.
 */
export function formatDate(date: string | number | Date): string {
  return new Date(date).toLocaleDateString('pl-PL');
}
