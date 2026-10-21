import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@/test/test-utils';
import { EventSelfServiceSection } from '../EventSelfServiceSection';

describe('EventSelfServiceSection', () => {
  it('toggles self-service and hides the date fields when switched off', () => {
    const onEnabledChange = vi.fn();
    const { rerender } = render(
      <EventSelfServiceSection
        enabled
        onEnabledChange={onEnabledChange}
        deadline=""
        onDeadlineChange={vi.fn()}
        eventDate="2030-06-20"
      />,
    );

    expect(
      screen.getByText(/Bez własnej daty rezygnacja jest możliwa do 7 dni przed startem/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Zawodnik może sam zrezygnować z zapisu' }));
    expect(onEnabledChange).toHaveBeenCalledWith(false);

    rerender(
      <EventSelfServiceSection
        enabled={false}
        onEnabledChange={onEnabledChange}
        deadline=""
        onDeadlineChange={vi.fn()}
        eventDate="2030-06-20"
      />,
    );
    expect(screen.queryByText('Data graniczna rezygnacji')).not.toBeInTheDocument();
  });

  it('shows the chosen cut-off and lets the time stay disabled until a date is set', () => {
    render(
      <EventSelfServiceSection
        enabled
        onEnabledChange={vi.fn()}
        deadline="2030-06-10T18:00"
        onDeadlineChange={vi.fn()}
        eventDate="2030-06-20"
      />,
    );

    expect(
      screen.getByText(/Po tej dacie zawodnik nie zrezygnuje samodzielnie/),
    ).toBeInTheDocument();
  });
});
