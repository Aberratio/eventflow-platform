import { describe, it, expect } from 'vitest';
import { htmlToPlainText } from '../html';

describe('htmlToPlainText', () => {
  it('extracts text', () => {
    expect(htmlToPlainText('<p>Ala <strong>ma</strong> kota</p>')).toBe('Ala ma kota');
  });

  it('never parses into the live document', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    expect(descriptor).toBeDefined();
    const originalSet = descriptor!.set!;
    const liveDocumentAssignments: boolean[] = [];

    Object.defineProperty(Element.prototype, 'innerHTML', {
      ...descriptor,
      set(this: Element, value: string) {
        liveDocumentAssignments.push(this.ownerDocument === document);
        originalSet.call(this, value);
      },
    });

    try {
      const text = htmlToPlainText('<img src=x onerror="window.__xss=1">');
      expect(text).toBe('');
      expect(liveDocumentAssignments.some(Boolean)).toBe(false);
    } finally {
      Object.defineProperty(Element.prototype, 'innerHTML', descriptor!);
    }
  });

  it('returns empty string for empty input', () => {
    expect(htmlToPlainText('')).toBe('');
  });
});
