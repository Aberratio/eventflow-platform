import type { RegistrationChange } from '@/types';

/** R-02: Polish one-liner for a history entry; unknown types fall back to a neutral text. */
export function describeRegistrationChange(change: RegistrationChange): string {
  switch (change.type) {
    case 'cancelled': {
      const by = change.actorRole === 'owner' ? 'Zrezygnowano z udziału' : 'Zapis anulowany';
      const refund = change.to?.refundRequested === true ? ' — złożono wniosek o zwrot' : '';
      return `${by}${refund}`;
    }
    case 'distance_changed':
      return 'Zmieniono dystans';
    case 'transferred':
      return 'Zapis przeniesiono na inną osobę';
    default:
      return 'Zmiana zapisu';
  }
}
