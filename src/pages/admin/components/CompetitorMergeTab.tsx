import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getCompetitorMergeComparison, mergeCompetitors, searchCompetitorsForMerge } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { DuplicateReportsQueue } from './DuplicateReportsQueue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  GitMerge,
  AlertTriangle,
  Users,
  Trophy,
  Medal,
  HeartHandshake,
} from 'lucide-react';
import type {
  Competitor,
  CompetitorMergeComparableField,
  CompetitorMergeConflict,
  CompetitorMergeFieldDecisions,
  CompetitorMergeProfileBundle,
} from '@/types';

const FIELD_LABELS: Record<CompetitorMergeComparableField, string> = {
  firstName: 'Imię',
  lastName: 'Nazwisko',
  birthDate: 'Data urodzenia',
  gender: 'Płeć',
  email: 'E-mail',
  phone: 'Telefon',
  club: 'Klub',
};

const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Oczekujący',
  confirmed: 'Potwierdzony',
  cancelled: 'Anulowany',
  removed: 'Usunięty',
  expired: 'Wygasły',
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

/**
 * Wyłącznie
 * Moderator/Admin — nigdy samoobsługa, nawet dla opiekuna sprawującego
 * Opiekę nad oboma profilami. Wchodzi zarówno w Panel
 * Administratora, jak i Panel Moderatora — patrz AdminDashboard/
 * ModeratorDashboard, które oba montują ten sam komponent (dokładnie ten sam
 * wzorzec co AdminSeriesTab/AdminFeaturedEventsTab, już współdzielone
 * pomiędzy oboma panelami).
 *
 * Przepływ: wyszukaj dwa profile -> porównaj "obok siebie" -> wskaż
 * przeżywający -> rozstrzygnij pola rozbieżne -> rozstrzygnij ewentualny
 * konflikt Zapisów -> potwierdź (operacja jest permanentna, brak "cofnij").
 */
export const CompetitorMergeTab = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [idA, setIdA] = useState<string | null>(null);
  const [idB, setIdB] = useState<string | null>(null);
  const [survivorId, setSurvivorId] = useState<string | null>(null);
  const [fieldDecisions, setFieldDecisions] = useState<CompetitorMergeFieldDecisions>({});
  const [conflictWinners, setConflictWinners] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState<CompetitorMergeConflict[] | null>(null);
  const [missingFields, setMissingFields] = useState<CompetitorMergeComparableField[] | null>(null);

  const { data: searchResponse, isFetching: isSearching } = useQuery({
    queryKey: QUERY_KEYS.competitorMergeSearch(searchTerm),
    queryFn: () => searchCompetitorsForMerge(searchTerm),
    enabled: searchTerm.trim().length >= 2,
  });
  const searchResults = searchResponse?.data ?? [];

  const { data: comparisonResponse, isLoading: isLoadingComparison } = useQuery({
    queryKey: QUERY_KEYS.competitorMergeComparison(idA ?? '', idB ?? ''),
    queryFn: () => getCompetitorMergeComparison(idA as string, idB as string),
    enabled: Boolean(idA && idB),
  });
  const comparison = comparisonResponse?.data ?? null;

  const [bundleA, bundleB] = comparison?.competitors ?? [null, null];
  const survivorBundle =
    bundleA && bundleB
      ? bundleA.competitor.id === survivorId
        ? bundleA
        : bundleB.competitor.id === survivorId
          ? bundleB
          : null
      : null;
  const absorbedBundle =
    bundleA && bundleB
      ? survivorBundle === bundleA
        ? bundleB
        : survivorBundle === bundleB
          ? bundleA
          : null
      : null;

  const differingFields = useMemo<CompetitorMergeComparableField[]>(() => {
    if (!survivorBundle || !absorbedBundle) return [];
    return (Object.keys(FIELD_LABELS) as CompetitorMergeComparableField[]).filter((field) => {
      const a = survivorBundle.competitor[field] ?? null;
      const b = absorbedBundle.competitor[field] ?? null;
      return (a || null) !== (b || null);
    });
  }, [survivorBundle, absorbedBundle]);

  const conflicts = comparison?.conflicts ?? [];
  const allConflictsResolved = conflicts.every(
    (c) => conflictWinners[conflictKey(c)] !== undefined,
  );
  const allFieldsResolved = differingFields.every((field) => fieldDecisions[field] !== undefined);
  const canReviewMerge = Boolean(survivorId && allFieldsResolved && allConflictsResolved);

  const mergeMutation = useMutation({
    mutationFn: () => {
      if (!survivorId || !absorbedBundle) throw new Error('Wybierz profil przeżywający.');
      return mergeCompetitors({
        survivorId,
        absorbedId: absorbedBundle.competitor.id,
        fieldDecisions,
        conflictResolutions: conflicts.map((c) => ({
          eventId: c.eventId,
          distanceId: c.distanceId,
          winnerRegistrationId: conflictWinners[conflictKey(c)],
        })),
      });
    },
    onSuccess: (response) => {
      const result = response.data;
      if (result.status === 'merged') {
        toast.success(
          `Profil "${result.absorbed.firstName} ${result.absorbed.lastName}" scalony z "${result.survivor.firstName} ${result.survivor.lastName}".`,
        );
        queryClient.invalidateQueries({ queryKey: ['competitors'] });
        resetAll();
        return;
      }
      if (result.status === 'field_decisions_required') {
        setMissingFields(result.fields);
        toast.error('Rozstrzygnij ręcznie pola, w których profile się różnią.');
        return;
      }
      if (result.status === 'conflict_pending') {
        setPendingConflicts(result.conflicts);
        toast.error('Wykryto konflikt Zapisów na ten sam Dystans — wskaż, który zostaje.');
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się scalić profili.');
    },
  });

  function conflictKey(c: CompetitorMergeConflict): string {
    return `${c.eventId}::${c.distanceId}`;
  }

  function resetAll() {
    setSearch('');
    setSearchTerm('');
    setIdA(null);
    setIdB(null);
    setSurvivorId(null);
    setFieldDecisions({});
    setConflictWinners({});
    setConfirmOpen(false);
    setPendingConflicts(null);
    setMissingFields(null);
  }

  function pick(competitor: Competitor) {
    if (competitor.id === idA || competitor.id === idB) return;
    if (!idA) {
      setIdA(competitor.id);
    } else if (!idB) {
      setIdB(competitor.id);
    } else {
      // Both slots taken — replace the second one, keep the first, mirroring
      // "wyszukaj dwa profile" as a two-slot picker rather than a growing list.
      setIdB(competitor.id);
    }
    setSurvivorId(null);
    setFieldDecisions({});
    setConflictWinners({});
    setMissingFields(null);
    setPendingConflicts(null);
  }

  const registrationById = (bundle: CompetitorMergeProfileBundle | null, id: string) =>
    bundle?.registrations.find((r) => r.id === id) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Scalanie profili Zawodnika</h2>
        <p className="text-sm text-muted-foreground">
          Wyłącznie Moderator/Admin. Znajdź dwa podejrzane o duplikat profile, porównaj je obok
          siebie i wskaż, który zostaje. Operacja jest trwała — wchłonięty profil pozostaje jako
          archiwalny rekord ze stanem „scalony”, nigdy nie jest usuwany.
        </p>
      </div>

      <DuplicateReportsQueue
        onCompare={(a, b) => {
          setIdA(a);
          setIdB(b);
          setSurvivorId(null);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        {[idA, idB].map((id, index) =>
          id ? (
            <Badge key={id} variant="secondary" className="gap-1">
              Profil {index === 0 ? 'A' : 'B'}: {labelFor(id, bundleA, bundleB, searchResults)}
              <button
                type="button"
                aria-label={`Usuń profil ${index === 0 ? 'A' : 'B'} z porównania`}
                className="ml-1 rounded-full hover:bg-background/50"
                onClick={() => {
                  if (index === 0) setIdA(idB);
                  else setIdB(null);
                  setSurvivorId(null);
                }}
              >
                ×
              </button>
            </Badge>
          ) : (
            <Badge key={`empty-${index}`} variant="outline">
              Profil {index === 0 ? 'A' : 'B'}: nie wybrano
            </Badge>
          ),
        )}
      </div>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setSearchTerm(search.trim());
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Label htmlFor="competitor-merge-search" className="sr-only">
            Szukaj Zawodnika po imieniu, nazwisku albo kodzie tożsamości
          </Label>
          <Input
            id="competitor-merge-search"
            placeholder="Szukaj po imieniu, nazwisku albo kodzie tożsamości (zqr_...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="outline" disabled={search.trim().length < 2}>
          Szukaj
        </Button>
      </form>

      {searchTerm.trim().length >= 2 && (
        <div className="rounded-lg border" aria-live="polite">
          {isSearching ? (
            <p className="p-4 text-sm text-muted-foreground">Szukanie…</p>
          ) : searchResults.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Brak wyników.</p>
          ) : (
            <ul className="divide-y">
              {searchResults.map((competitor) => (
                <li key={competitor.id} className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {competitor.firstName} {competitor.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {competitor.birthDate ?? 'brak daty urodzenia'} · {competitor.identityCode}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={competitor.id === idA || competitor.id === idB}
                    onClick={() => pick(competitor)}
                  >
                    {competitor.id === idA || competitor.id === idB
                      ? 'Wybrano'
                      : 'Dodaj do porównania'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {idA && idB && (
        <div className="space-y-6">
          {isLoadingComparison && (
            <p className="text-sm text-muted-foreground">Wczytywanie porównania…</p>
          )}

          {comparison && bundleA && bundleB && (
            <>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">
                  Który profil przeżywa? (wybór ręczny — sugestia bogatszej historii nie jest regułą
                  automatyczną)
                </legend>
                <RadioGroup
                  value={survivorId ?? ''}
                  onValueChange={(value) => {
                    setSurvivorId(value);
                    setFieldDecisions({});
                    setConflictWinners({});
                  }}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {[bundleA, bundleB].map((bundle) => (
                    <Label
                      key={bundle.competitor.id}
                      htmlFor={`survivor-${bundle.competitor.id}`}
                      className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 hover:bg-accent/40"
                    >
                      <RadioGroupItem
                        id={`survivor-${bundle.competitor.id}`}
                        value={bundle.competitor.id}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium">
                          {bundle.competitor.firstName} {bundle.competitor.lastName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {bundle.registrations.length} zapisów · {bundle.lifetimeRecords.length}{' '}
                          rekordów · {bundle.caregivers.length} opiekunów
                        </span>
                        {richerHistory(bundle, bundle === bundleA ? bundleB : bundleA) && (
                          <Badge variant="outline" className="mt-1">
                            Sugerowany (bogatsza historia)
                          </Badge>
                        )}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </fieldset>

              <div className="grid gap-4 md:grid-cols-2">
                {[bundleA, bundleB].map((bundle) => (
                  <ProfileCompareCard
                    key={bundle.competitor.id}
                    bundle={bundle}
                    role={
                      survivorId === bundle.competitor.id
                        ? 'survivor'
                        : survivorId
                          ? 'absorbed'
                          : null
                    }
                  />
                ))}
              </div>

              {survivorBundle && absorbedBundle && differingFields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Rozbieżne pola — wybierz wartość, która przechodzi do scalonego profilu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {missingFields && missingFields.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Brakuje decyzji</AlertTitle>
                        <AlertDescription>
                          Rozstrzygnij ręcznie:{' '}
                          {missingFields.map((f) => FIELD_LABELS[f]).join(', ')}.
                        </AlertDescription>
                      </Alert>
                    )}
                    {differingFields.map((field) => (
                      <fieldset key={field} className="space-y-2">
                        <legend className="text-sm font-medium">{FIELD_LABELS[field]}</legend>
                        <RadioGroup
                          value={fieldDecisions[field] ?? ''}
                          onValueChange={(value) =>
                            setFieldDecisions((prev) => ({
                              ...prev,
                              [field]: value as 'survivor' | 'absorbed',
                            }))
                          }
                          className="grid gap-2 sm:grid-cols-2"
                        >
                          <Label
                            htmlFor={`field-${field}-survivor`}
                            className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent/40"
                          >
                            <RadioGroupItem id={`field-${field}-survivor`} value="survivor" />
                            {displayValue(survivorBundle.competitor[field])}{' '}
                            <span className="text-xs text-muted-foreground">(przeżywający)</span>
                          </Label>
                          <Label
                            htmlFor={`field-${field}-absorbed`}
                            className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent/40"
                          >
                            <RadioGroupItem id={`field-${field}-absorbed`} value="absorbed" />
                            {displayValue(absorbedBundle.competitor[field])}{' '}
                            <span className="text-xs text-muted-foreground">(wchłaniany)</span>
                          </Label>
                        </RadioGroup>
                      </fieldset>
                    ))}
                  </CardContent>
                </Card>
              )}

              {(pendingConflicts ?? conflicts).length > 0 && survivorBundle && absorbedBundle && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Konflikt Zapisów — ten sam Dystans tego samego Wydarzenia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Scalenie jest wstrzymane dla poniższych par, dopóki nie wskażesz, który Zapis
                      zostaje. Odrzucony przejdzie standardową ścieżką anulowania/zwrotu.
                    </p>
                    {(pendingConflicts ?? conflicts).map((conflict) => {
                      const key = conflictKey(conflict);
                      const [regIdA, regIdB] = conflict.registrationIds;
                      const regA =
                        registrationById(survivorBundle, regIdA) ??
                        registrationById(absorbedBundle, regIdA);
                      const regB =
                        registrationById(survivorBundle, regIdB) ??
                        registrationById(absorbedBundle, regIdB);
                      return (
                        <fieldset key={key} className="space-y-2 rounded-md border p-3">
                          <legend className="text-sm font-medium">
                            {conflict.eventName} · {conflict.distanceName}
                          </legend>
                          <RadioGroup
                            value={conflictWinners[key] ?? ''}
                            onValueChange={(value) =>
                              setConflictWinners((prev) => ({ ...prev, [key]: value }))
                            }
                            className="grid gap-2 sm:grid-cols-2"
                          >
                            {[regA, regB].filter(Boolean).map((reg) => (
                              <Label
                                key={reg!.id}
                                htmlFor={`conflict-${key}-${reg!.id}`}
                                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent/40"
                              >
                                <RadioGroupItem id={`conflict-${key}-${reg!.id}`} value={reg!.id} />
                                <span>
                                  Nr {reg!.bibNumber ?? '—'} ·{' '}
                                  {REGISTRATION_STATUS_LABELS[reg!.status] ?? reg!.status} ·{' '}
                                  {reg!.category}
                                </span>
                              </Label>
                            ))}
                          </RadioGroup>
                        </fieldset>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={!canReviewMerge || mergeMutation.isPending}
                  onClick={() => setConfirmOpen(true)}
                >
                  <GitMerge className="mr-2 h-4 w-4" />
                  Przejrzyj i scal
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potwierdź scalenie profili</AlertDialogTitle>
            <AlertDialogDescription>
              Profil „{absorbedBundle?.competitor.firstName} {absorbedBundle?.competitor.lastName}”
              zostanie trwale scalony z „{survivorBundle?.competitor.firstName}{' '}
              {survivorBundle?.competitor.lastName}”. Wszystkie Zapisy, Opieki i historia
              wchłoniętego profilu zostaną przepięte na profil przeżywający; wchłonięty profil
              pozostanie jako archiwalny rekord ze stanem „scalony”. Ta operacja nie ma przycisku
              „cofnij” — błędne scalenie wymaga ręcznej korekty przez support na podstawie snapshotu
              w logu aktywności.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              disabled={mergeMutation.isPending}
              onClick={() => {
                setConfirmOpen(false);
                mergeMutation.mutate();
              }}
            >
              {mergeMutation.isPending ? 'Scalanie…' : 'Scal profile'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function labelFor(
  id: string,
  bundleA: CompetitorMergeProfileBundle | null,
  bundleB: CompetitorMergeProfileBundle | null,
  searchResults: Competitor[],
): string {
  const fromBundle = [bundleA, bundleB].find((b) => b?.competitor.id === id)?.competitor;
  const fromSearch = searchResults.find((c) => c.id === id);
  const competitor = fromBundle ?? fromSearch;
  return competitor ? `${competitor.firstName} ${competitor.lastName}` : id;
}

function richerHistory(
  candidate: CompetitorMergeProfileBundle,
  other: CompetitorMergeProfileBundle,
): boolean {
  const score = (b: CompetitorMergeProfileBundle) =>
    b.registrations.length + b.lifetimeRecords.length + b.caregivers.length;
  return score(candidate) > score(other);
}

const ProfileCompareCard = ({
  bundle,
  role,
}: {
  bundle: CompetitorMergeProfileBundle;
  role: 'survivor' | 'absorbed' | null;
}) => {
  const { competitor } = bundle;
  return (
    <Card className={role === 'survivor' ? 'border-primary' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>
            {competitor.firstName} {competitor.lastName}
          </span>
          {role === 'survivor' && <Badge>Przeżywa</Badge>}
          {role === 'absorbed' && <Badge variant="destructive">Zostanie wchłonięty</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <dl className="grid grid-cols-2 gap-x-2 gap-y-1">
          <dt className="text-muted-foreground">Data urodzenia</dt>
          <dd>{displayValue(competitor.birthDate)}</dd>
          <dt className="text-muted-foreground">Płeć</dt>
          <dd>{displayValue(competitor.gender)}</dd>
          <dt className="text-muted-foreground">E-mail</dt>
          <dd className="truncate">{displayValue(competitor.email)}</dd>
          <dt className="text-muted-foreground">Telefon</dt>
          <dd>{displayValue(competitor.phone)}</dd>
          <dt className="text-muted-foreground">Klub</dt>
          <dd>{displayValue(competitor.club)}</dd>
          <dt className="text-muted-foreground">Kod tożsamości</dt>
          <dd className="truncate font-mono text-xs">{competitor.identityCode}</dd>
        </dl>

        <Separator />

        <div>
          <p className="mb-1 flex items-center gap-1.5 font-medium">
            <Users className="h-3.5 w-3.5" /> Zapisy ({bundle.registrations.length})
          </p>
          {bundle.registrations.length === 0 ? (
            <p className="text-muted-foreground">Brak.</p>
          ) : (
            <ul className="space-y-1">
              {bundle.registrations.map((reg) => (
                <li key={reg.id} className="text-xs">
                  {reg.eventName} · {reg.distanceName} ·{' '}
                  {REGISTRATION_STATUS_LABELS[reg.status] ?? reg.status}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-1 flex items-center gap-1.5 font-medium">
            <Trophy className="h-3.5 w-3.5" /> Rekordy życiowe ({bundle.lifetimeRecords.length})
          </p>
          {bundle.lifetimeRecords.length === 0 ? (
            <p className="text-muted-foreground">Brak.</p>
          ) : (
            <ul className="space-y-1">
              {bundle.lifetimeRecords.map((record) => (
                <li key={record.resultId} className="text-xs">
                  {record.distanceLabel}: {record.time}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-1 flex items-center gap-1.5 font-medium">
            <Medal className="h-3.5 w-3.5" /> Uczestnictwa w Wyzwaniach (
            {bundle.challengeParticipations.length})
          </p>
          {bundle.challengeParticipations.length === 0 ? (
            <p className="text-muted-foreground">
              Brak — albo ten profil nie ma własnego Konta (Uczestnictwa są przypisane do Konta, nie
              do Zawodnika, więc scalanie nigdy ich nie przepina).
            </p>
          ) : (
            <ul className="space-y-1">
              {bundle.challengeParticipations.map((p) => (
                <li key={p.id} className="text-xs">
                  {p.isCompleted ? 'Ukończone' : 'W trakcie'}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-1 flex items-center gap-1.5 font-medium">
            <HeartHandshake className="h-3.5 w-3.5" /> Opiekunowie ({bundle.caregivers.length})
          </p>
          {bundle.caregivers.length === 0 ? (
            <p className="text-muted-foreground">Brak.</p>
          ) : (
            <ul className="space-y-1">
              {bundle.caregivers.map((c) => (
                <li key={c.id} className="text-xs">
                  {c.kontoName} ({c.kontoEmail})
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
