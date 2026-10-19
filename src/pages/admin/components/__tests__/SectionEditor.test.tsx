import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SectionEditor } from '../SectionEditor';
import type { InfoPageSection } from '@/types';

const textSection = (over: Partial<InfoPageSection>): InfoPageSection => ({
  id: 'b',
  type: 'text',
  title: '',
  content: '',
  ...over,
});

describe('SectionEditor text block (B-08)', () => {
  it('opens a legacy text block converted to HTML', async () => {
    render(
      <SectionEditor
        section={textSection({ content: 'Wstęp **ważny**\n- punkt' })}
        onUpdate={vi.fn()}
      />,
    );
    await waitFor(() => {
      const pm = document.querySelector('.ProseMirror');
      expect(pm?.querySelector('strong')?.textContent).toBe('ważny');
      expect(pm?.querySelectorAll('li').length).toBe(1);
    });
  });

  it('saves edits as HTML with format "html"', async () => {
    const onUpdate = vi.fn();
    render(
      <SectionEditor section={textSection({ format: 'html', content: '' })} onUpdate={onUpdate} />,
    );
    await waitFor(() => expect(document.querySelector('.ProseMirror')).not.toBeNull());
    await userEvent.click(document.querySelector('.ProseMirror') as HTMLElement);
    await userEvent.keyboard('hi');
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    const last = onUpdate.mock.calls.at(-1)?.[0];
    expect(last.format).toBe('html');
    expect(last.content).toContain('hi');
  });
});
