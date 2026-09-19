import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChallengeConditionTreeSection, defaultNodeForType } from '../ChallengeConditionTreeEditor';
import type { Challenge, ChallengeConditionNode, Event } from '@/types';

// jsdom does not implement the Pointer Events methods Radix's Select uses;
// stub them the same way ShopPage.test.tsx / AddDiscountCodeDialog.test.tsx do.
Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  value: () => false,
});
Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
  value: () => undefined,
});
Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
  value: () => undefined,
});
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => undefined,
});

// E6.1 (issue 15 §1): the tree-builder UI is the only way an admin composes
// a Wyzwanie's completion condition tree (event_threshold / point_threshold /
// sub_challenge_threshold, joined by a `group` AND/threshold node). These
// tests exercise node-type switching, add/remove of `group` children, and
// the sub-challenge picker's "already-saved only" invariant.

const events: Event[] = [
  {
    id: 'evt-1',
    name: 'Bieg Wiosenny',
    slug: 'bieg-wiosenny',
    discipline: 'running',
    date: '2026-04-01',
    location: 'Park',
    city: 'Warszawa',
    description: '',
    imageUrl: '',
  } as Event,
  {
    id: 'evt-2',
    name: 'Bieg Jesienny',
    slug: 'bieg-jesienny',
    discipline: 'running',
    date: '2026-10-01',
    location: 'Park',
    city: 'Kraków',
    description: '',
    imageUrl: '',
  } as Event,
];

const otherChallenges: Challenge[] = [
  {
    id: 'chal-saved-1',
    name: 'Korona 2025',
    slug: 'korona-2025',
    description: '',
    events: [],
    rule: { minCompleted: 1 },
    rewards: [],
    status: 'active',
    createdBy: 'tester',
  },
  {
    id: 'chal-saved-2',
    name: 'Grand Prix 2025',
    slug: 'grand-prix-2025',
    description: '',
    events: [],
    rule: { minCompleted: 1 },
    rewards: [],
    status: 'active',
    createdBy: 'tester',
  },
];

const ControlledTree = ({ initial }: { initial: ChallengeConditionNode }) => {
  const [tree, setTree] = useState(initial);
  return (
    <ChallengeConditionTreeSection
      tree={tree}
      onChange={setTree}
      events={events}
      otherChallenges={otherChallenges}
    />
  );
};

describe('ChallengeConditionTreeEditor', () => {
  it('shows the event picker and required-count field for an event_threshold root by default', () => {
    render(<ControlledTree initial={defaultNodeForType('event_threshold')} />);

    expect(screen.getByLabelText(/Wymagana liczba \(N\)/)).toBeInTheDocument();
    expect(screen.getByText('Bieg Wiosenny · 2026-04-01')).toBeInTheDocument();
    expect(screen.getByText('Bieg Jesienny · 2026-10-01')).toBeInTheDocument();
    // point_threshold-only and sub_challenge_threshold-only fields must not render
    expect(screen.queryByLabelText(/Wymagana liczba punktów/)).not.toBeInTheDocument();
    expect(screen.queryByText('Korona 2025')).not.toBeInTheDocument();
  });

  it('switching node type to point_threshold shows its own fields and hides the N-of-M count', async () => {
    const user = userEvent.setup();
    render(<ControlledTree initial={defaultNodeForType('event_threshold')} />);

    await user.click(screen.getByLabelText('Typ warunku'));
    await user.click(await screen.findByRole('option', { name: 'Próg punktowy' }));

    expect(screen.getByLabelText(/Wymagana liczba punktów \(X\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Licz N najlepszych wyników/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Wymagana liczba \(N\)/)).not.toBeInTheDocument();
  });

  it('switching node type to sub_challenge_threshold only offers already-saved challenges', async () => {
    const user = userEvent.setup();
    render(<ControlledTree initial={defaultNodeForType('event_threshold')} />);

    await user.click(screen.getByLabelText('Typ warunku'));
    await user.click(await screen.findByRole('option', { name: 'Próg pod-Wyzwań' }));

    expect(screen.getByText('Korona 2025')).toBeInTheDocument();
    expect(screen.getByText('Grand Prix 2025')).toBeInTheDocument();
    // The event checklist (a different node type's field) must not leak in.
    expect(screen.queryByText('Bieg Wiosenny · 2026-04-01')).not.toBeInTheDocument();
  });

  it('a group node starts with one child and "Dodaj węzeł podrzędny" adds another', async () => {
    const user = userEvent.setup();
    render(<ControlledTree initial={defaultNodeForType('group')} />);

    expect(screen.getAllByText(/^Dziecko \d/)).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /Dodaj węzeł podrzędny/ }));

    expect(screen.getAllByText(/^Dziecko \d/)).toHaveLength(2);
  });

  it('removing a group child is only offered once there is more than one, and it removes the right one', async () => {
    const user = userEvent.setup();
    render(<ControlledTree initial={defaultNodeForType('group')} />);

    // Single child: no remove button for it (only the root has no remove
    // control either, by design — a group must always keep at least one).
    expect(screen.queryByLabelText(/Usuń węzeł: Dziecko 1/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Dodaj węzeł podrzędny/ }));
    expect(screen.getAllByText(/^Dziecko \d/)).toHaveLength(2);

    await user.click(screen.getByLabelText('Usuń węzeł: Dziecko 2'));
    expect(screen.getAllByText(/^Dziecko \d/)).toHaveLength(1);
  });

  it('toggling an event checkbox on an event_threshold node updates its linked events', async () => {
    const user = userEvent.setup();
    render(<ControlledTree initial={defaultNodeForType('event_threshold')} />);

    const row = screen.getByText('Bieg Wiosenny · 2026-04-01').closest('label');
    expect(row).not.toBeNull();
    const checkbox = within(row as HTMLElement).getByRole('checkbox');

    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });
});
