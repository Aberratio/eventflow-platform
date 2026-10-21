import type { RegistrationChange } from '@/types';

/** Polish one-liner for a history entry; unknown types fall back to a neutral text. */
export function describeRegistrationChange(change: RegistrationChange): string {
  switch (change.type) {
    case 'cancelled': {
      const by = change.actorRole === 'owner' ? 'Zrezygnowano z udziału' : 'Zapis anulowany';
      const refund = change.to?.refundRequested === true ? ' — złożono wniosek o zwrot' : '';
      return `${by}${refund}`;
    }
    case 'distance_changed': {
      const from = typeof change.from?.distanceName === 'string' ? change.from.distanceName : null;
      const to = typeof change.to?.distanceName === 'string' ? change.to.distanceName : null;
      const names = from && to ? `: ${from} → ${to}` : '';
      const by = change.actorRole === 'manager' ? ' (przez organizatora)' : '';
      const refund =
        change.to?.refundRequested === true ? ' — złożono wniosek o zwrot nadpłaty' : '';
      return `Zmieniono dystans${names}${by}${refund}`;
    }
    case 'transferred':
      return 'Zapis przeniesiono na inną osóbę';
    default:
      return 'Zmiana zapisu';
  }
}
