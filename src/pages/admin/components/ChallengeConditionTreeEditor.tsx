import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { Challenge, ChallengeConditionNode, ChallengeConditionNodeType, Event } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

const NODE_TYPE_LABELS: Record<ChallengeConditionNodeType, string> = {
  event_threshold: 'Próg wydarzeń',
  point_threshold: 'Próg punktowy',
  sub_challenge_threshold: 'Próg pod-Wyzwań',
  group: 'Grupa (AND / próg złożony)',
};

const defaultNodeForType = (type: ChallengeConditionNodeType): ChallengeConditionNode => {
  switch (type) {
    case 'event_threshold':
      return { type, requiredCount: 0, events: [] };
    case 'point_threshold':
      return { type, pointsRequired: 0, bestResultsCount: undefined, events: [] };
    case 'sub_challenge_threshold':
      return { type, requiredCount: 0, subChallenges: [] };
    case 'group':
      return { type, requiredCount: 0, children: [defaultNodeForType('event_threshold')] };
  }
};

interface NodeEditorProps {
  node: ChallengeConditionNode;
  onChange: (node: ChallengeConditionNode) => void;
  onRemove?: () => void;
  events: Event[];
  otherChallenges: Challenge[];
  depth: number;
  label: string;
}

/**
 * E6.1: recursive editor for one node of a Wyzwanie's completion condition
 * tree (issue 15 §1). A straightforward add/remove-child tree builder, not
 * drag-and-drop, per the ticket's own scope note.
 */
const ChallengeConditionNodeEditor = ({
  node,
  onChange,
  onRemove,
  events,
  otherChallenges,
  depth,
  label,
}: NodeEditorProps) => {
  const headingId = `condition-node-${depth}-${label.replace(/\s+/g, '-')}`;
  const selectedEventIds = new Set((node.events ?? []).map((e) => e.eventId));
  const selectedSubChallengeIds = new Set((node.subChallenges ?? []).map((s) => s.challengeId));

  const changeType = (type: ChallengeConditionNodeType) => onChange(defaultNodeForType(type));

  const toggleEvent = (eventId: string) => {
    const current = node.events ?? [];
    const exists = current.some((e) => e.eventId === eventId);
    const event = events.find((e) => e.id === eventId);
    onChange({
      ...node,
      events: exists
        ? current.filter((e) => e.eventId !== eventId)
        : [
            ...current,
            { eventId, eventName: event?.name ?? eventId, eventDate: event?.date ?? '' },
          ],
    });
  };

  const toggleSubChallenge = (challengeId: string) => {
    const current = node.subChallenges ?? [];
    const exists = current.some((c) => c.challengeId === challengeId);
    const challenge = otherChallenges.find((c) => c.id === challengeId);
    onChange({
      ...node,
      subChallenges: exists
        ? current.filter((c) => c.challengeId !== challengeId)
        : [...current, { challengeId, name: challenge?.name ?? challengeId }],
    });
  };

  const addChild = () =>
    onChange({
      ...node,
      children: [...(node.children ?? []), defaultNodeForType('event_threshold')],
    });

  const removeChild = (index: number) =>
    onChange({ ...node, children: (node.children ?? []).filter((_, i) => i !== index) });

  const updateChild = (index: number, child: ChallengeConditionNode) =>
    onChange({
      ...node,
      children: (node.children ?? []).map((c, i) => (i === index ? child : c)),
    });

  return (
    <fieldset
      className="m-0 space-y-3 rounded border p-3"
      aria-labelledby={headingId}
      style={{ marginInlineStart: depth > 0 ? '1rem' : undefined }}
    >
      <legend id={headingId} className="flex items-center gap-2 px-1 text-sm font-semibold">
        {label}
        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Usuń węzeł: ${label}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </legend>

      <div>
        <Label htmlFor={`${headingId}-type`}>Typ warunku</Label>
        <Select
          value={node.type}
          onValueChange={(value) => changeType(value as ChallengeConditionNodeType)}
        >
          <SelectTrigger id={`${headingId}-type`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(NODE_TYPE_LABELS) as ChallengeConditionNodeType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {NODE_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {node.type !== 'group' && node.type !== 'point_threshold' && (
        <div>
          <Label htmlFor={`${headingId}-required`}>
            Wymagana liczba (N){' '}
            {node.type === 'event_threshold' ? `z ${node.events?.length ?? 0} wskazanych` : null}
            {node.type === 'sub_challenge_threshold'
              ? `z ${node.subChallenges?.length ?? 0} wskazanych`
              : null}
          </Label>
          <Input
            id={`${headingId}-required`}
            type="number"
            min={0}
            value={node.requiredCount ?? 0}
            onChange={(e) => onChange({ ...node, requiredCount: Number(e.target.value) || 0 })}
          />
        </div>
      )}

      {node.type === 'group' && (
        <div>
          <Label htmlFor={`${headingId}-required`}>
            Wymagana liczba spełnionych warunków (N) z {node.children?.length ?? 0} — N = liczba
            dzieci oznacza AND (wszystkie wymagane)
          </Label>
          <Input
            id={`${headingId}-required`}
            type="number"
            min={0}
            value={node.requiredCount ?? 0}
            onChange={(e) => onChange({ ...node, requiredCount: Number(e.target.value) || 0 })}
          />
        </div>
      )}

      {node.type === 'point_threshold' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${headingId}-points`}>Wymagana liczba punktów (X)</Label>
            <Input
              id={`${headingId}-points`}
              type="number"
              min={0}
              value={node.pointsRequired ?? 0}
              onChange={(e) => onChange({ ...node, pointsRequired: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor={`${headingId}-best`}>Licz N najlepszych wyników (opcjonalnie)</Label>
            <Input
              id={`${headingId}-best`}
              type="number"
              min={0}
              value={node.bestResultsCount ?? ''}
              onChange={(e) =>
                onChange({
                  ...node,
                  bestResultsCount: e.target.value === '' ? undefined : Number(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>
      )}

      {(node.type === 'event_threshold' ||
        node.type === 'point_threshold' ||
        node.type === 'sub_challenge_threshold') && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${headingId}-window-start`}>Okno czasowe od (opcjonalnie)</Label>
            <DateInput
              id={`${headingId}-window-start`}
              value={node.windowStart ?? ''}
              onValueChange={(windowStart) =>
                onChange({ ...node, windowStart: windowStart || null })
              }
            />
          </div>
          <div>
            <Label htmlFor={`${headingId}-window-end`}>Okno czasowe do (opcjonalnie)</Label>
            <DateInput
              id={`${headingId}-window-end`}
              value={node.windowEnd ?? ''}
              onValueChange={(windowEnd) => onChange({ ...node, windowEnd: windowEnd || null })}
            />
          </div>
        </div>
      )}

      {(node.type === 'event_threshold' || node.type === 'point_threshold') && (
        <fieldset className="m-0 space-y-2 border-0 p-0">
          <legend className="text-xs font-semibold leading-none text-foreground">
            Wskazane Wydarzenia
          </legend>
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground">Brak dostępnych Wydarzeń.</p>
          )}
          <div className="grid gap-2">
            {events.map((event) => (
              <label key={event.id} className="flex items-center gap-2 rounded border p-2 text-sm">
                <Checkbox
                  checked={selectedEventIds.has(event.id)}
                  onCheckedChange={() => toggleEvent(event.id)}
                />
                <span>
                  {event.name} · {event.date}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {node.type === 'sub_challenge_threshold' && (
        <fieldset className="m-0 space-y-2 border-0 p-0">
          <legend className="text-xs font-semibold leading-none text-foreground">
            Wskazane Wyzwania (tylko już zapisane)
          </legend>
          {otherChallenges.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Brak innych zapisanych Wyzwań do wskazania — zapisz najpierw Wyzwania niższego
              poziomu.
            </p>
          )}
          <div className="grid gap-2">
            {otherChallenges.map((challenge) => (
              <label
                key={challenge.id}
                className="flex items-center gap-2 rounded border p-2 text-sm"
              >
                <Checkbox
                  checked={selectedSubChallengeIds.has(challenge.id)}
                  onCheckedChange={() => toggleSubChallenge(challenge.id)}
                />
                <span>{challenge.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {node.type === 'group' && (
        <div className="space-y-3">
          {(node.children ?? []).map((child, index) => (
            <ChallengeConditionNodeEditor
              key={index}
              node={child}
              onChange={(updated) => updateChild(index, updated)}
              onRemove={(node.children?.length ?? 0) > 1 ? () => removeChild(index) : undefined}
              events={events}
              otherChallenges={otherChallenges}
              depth={depth + 1}
              label={`Dziecko ${index + 1}`}
            />
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addChild}>
            <Plus className="mr-2 h-4 w-4" /> Dodaj węzeł podrzędny
          </Button>
        </div>
      )}
    </fieldset>
  );
};

interface ChallengeConditionTreeSectionProps {
  tree: ChallengeConditionNode;
  onChange: (tree: ChallengeConditionNode) => void;
  events: Event[];
  otherChallenges: Challenge[];
}

export const ChallengeConditionTreeSection = ({
  tree,
  onChange,
  events,
  otherChallenges,
}: ChallengeConditionTreeSectionProps) => (
  <ChallengeConditionNodeEditor
    node={tree}
    onChange={onChange}
    events={events}
    otherChallenges={otherChallenges}
    depth={0}
    label="Korzeń drzewa warunków ukończenia"
  />
);

export { defaultNodeForType };
