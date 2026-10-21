import { useLayoutEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from '../rich-text-editor';

// TipTap's useEditor (immediatelyRender: true by default) builds the Editor during render and
// schedules a 1ms destroy timer. On a heavy page the passive-effect flush that would cancel that timer
// can land after it fires, so the editor gets destroyed (schema = null) before RichTextEditor's own sync
// effect calls editor.getHTML() on it. This harness reproduces "the timer fires after commit, before
// passive effects" deterministically with fake timers advanced from a sibling useLayoutEffect.
const FireTimersAfterCommit = () => {
  useLayoutEffect(() => {
    vi.advanceTimersByTime(5);
  }, []);
  return null;
};

describe('RichTextEditor', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not touch a destroyed editor when the destroy timer fires before passive effects', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const onChange = vi.fn();

    expect(() =>
      render(
        <>
          <RichTextEditor value="<p>hello</p>" onChange={onChange} ariaLabel="Opis" />
          <FireTimersAfterCommit />
        </>,
      ),
    ).not.toThrow();

    vi.useRealTimers();

    await waitFor(() => {
      expect(document.querySelector('.ProseMirror')).toHaveTextContent('hello');
    });
  });

  it('syncs an external value without calling onChange', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RichTextEditor value="<p>first</p>" onChange={onChange} ariaLabel="Opis" />,
    );
    await waitFor(() => expect(document.querySelector('.ProseMirror')).toHaveTextContent('first'));

    onChange.mockClear();
    rerender(<RichTextEditor value="<p>second</p>" onChange={onChange} ariaLabel="Opis" />);

    await waitFor(() => expect(document.querySelector('.ProseMirror')).toHaveTextContent('second'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange with HTML when the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RichTextEditor value="" onChange={onChange} ariaLabel="Opis" />);

    const textbox = await screen.findByRole('textbox', { name: 'Opis' });
    await user.click(textbox);
    await user.keyboard('hi');

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const lastCall = onChange.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain('hi');
  });

  it('registers link and underline once', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onChange = vi.fn();
    render(<RichTextEditor value="<p>hello</p>" onChange={onChange} ariaLabel="Opis" />);
    await waitFor(() => expect(document.querySelector('.ProseMirror')).toHaveTextContent('hello'));

    const duplicateWarning = warnSpy.mock.calls.some((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('Duplicate extension names')),
    );
    expect(duplicateWarning).toBe(false);
    warnSpy.mockRestore();
  });

  describe('link dialog', () => {
    beforeEach(async () => {
      // no-op, each test renders its own instance
    });

    it('converts an e-mail to mailto and rejects javascript:', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<RichTextEditor value="<p>hello world</p>" onChange={onChange} ariaLabel="Opis" />);
      const textbox = await screen.findByRole('textbox', { name: 'Opis' });
      await waitFor(() => expect(textbox).toHaveTextContent('hello world'));

      // Select all text in the editor before adding the link.
      await user.click(textbox);
      await user.keyboard('{Control>}a{/Control}');

      await user.click(screen.getByRole('button', { name: 'Dodaj link' }));
      const urlInput = screen.getByLabelText('Adres URL');
      await user.type(urlInput, 'biuro@a.pl');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(textbox.querySelector('a[href="mailto:biuro@a.pl"]')).toBeTruthy();
      });

      // Second case: javascript: must be rejected with an inline Polish error and insert no link.
      await user.click(textbox);
      await user.keyboard('{Control>}a{/Control}');
      await user.click(screen.getByRole('button', { name: 'Dodaj link' }));
      const urlInput2 = screen.getByLabelText('Adres URL');
      await user.clear(urlInput2);
      await user.type(urlInput2, 'javascript:alert(1)');
      await user.keyboard('{Enter}');

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Nieobsługiwany adres');
      expect(textbox.querySelector('a[href^="javascript:"]')).toBeNull();
    });
  });
});
