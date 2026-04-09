import type { GlobalInsuranceSettings } from '@/types';
import { mockRegistrations } from './registrations.mock';

export const mockGlobalInsuranceSettings: GlobalInsuranceSettings = {
  infoHtml: `
    <p><strong>Ubezpieczenie NNW dla sportowców</strong></p>
    <p>Ubezpieczenie od następstw nieszczęśliwych wypadków zapewnia:</p>
    <ul>
      <li>Ochronę podczas całych zawodów i rozgrzewki</li>
      <li>Pokrycie kosztów leczenia do 10 000 zł</li>
      <li>Świadczenie za trwały uszczerbek na zdrowiu</li>
      <li>Assistance medyczne 24/7</li>
    </ul>
    <p>Polisa jest ważna od momentu startu do zakończenia imprezy.</p>
    <p><a href="/info/ubezpieczenia">Szczegóły ubezpieczenia →</a></p>
  `,
  baseFee: 15,
  ageMultiplier: 0.5,
  maxAge: 70,
};

export const getExistingTeamsForEvent = (
  eventId: string,
): Array<{
  name: string;
  memberCount: number;
}> => {
  const teamsMap = new Map<string, number>();

  mockRegistrations
    .filter((r) => r.eventId === eventId && r.teamName && r.status !== 'cancelled')
    .forEach((r) => {
      const count = teamsMap.get(r.teamName!) || 0;
      teamsMap.set(r.teamName!, count + 1);
    });

  return Array.from(teamsMap.entries())
    .map(([name, memberCount]) => ({ name, memberCount }))
    .sort((a, b) => b.memberCount - a.memberCount);
};

export { validateTeamName } from '@/api/mock/helpers';
