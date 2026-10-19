import { describe, expect, it } from 'vitest';
import { legacyTextToHtml } from '../legacyTextToHtml';

describe('legacyTextToHtml', () => {
  it('converts paragraphs, bullet lists and bold', () => {
    expect(legacyTextToHtml('Wstęp **ważny**\n\n- jeden\n• dwa\nKoniec')).toBe(
      '<p>Wstęp <strong>ważny</strong></p><ul><li><p>jeden</p></li><li><p>dwa</p></li></ul><p>Koniec</p>',
    );
  });

  it('escapes raw HTML so nothing becomes markup', () => {
    expect(legacyTextToHtml('<img src=x onerror=alert(1)>')).toBe(
      '<p>&lt;img src=x onerror=alert(1)&gt;</p>',
    );
  });

  it('returns an empty string for empty input', () => {
    expect(legacyTextToHtml('')).toBe('');
  });
});
