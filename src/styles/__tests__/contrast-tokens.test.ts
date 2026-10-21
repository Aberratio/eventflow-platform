import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// WCAG 1.4.3: text and background tokens under white text must give >= 4.5:1.
const read = (f: string) => readFileSync(resolve(__dirname, '../tokens', f), 'utf8');
const css = read('palette.css') + read('theme-dark.css');

function hsl(name: string, seen = new Set<string>()): [number, number, number] {
  const m = css.match(new RegExp(`${name}: *([^;]+);`));
  if (!m) throw new Error(`token ${name} not found`);
  const v = m[1].replace(/\/\*.*?\*\//g, '').trim();
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  if (ref) {
    if (seen.has(ref[1])) throw new Error('cycle');
    return hsl(ref[1], seen.add(name));
  }
  const [h, s, l] = v.split(/\s+/).map((x) => parseFloat(x));
  return [h, s, l];
}

function rgb([h, s, l]: [number, number, number]): [number, number, number] {
  const sat = s / 100;
  const li = l / 100;
  const a = sat * Math.min(li, 1 - li);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return li - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

const lum = (c: [number, number, number]) => {
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: [number, number, number], b: [number, number, number]) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const WHITE: [number, number, number] = [1, 1, 1];
// The darkest/lightest backgrounds the brand text actually appears on (panels, cards).
const DARK_SURFACES = ['#0f1f35', '#121e2b', '#101418', '#070b12'];
const fromHex = (h: string): [number, number, number] =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

describe('contrast tokens (dark theme)', () => {
  it('--primary-text is readable on dark surfaces', () => {
    for (const bg of DARK_SURFACES) {
      expect(ratio(rgb(hsl('--primary-text')), fromHex(bg))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('white text on --primary and --destructive-solid backgrounds', () => {
    expect(ratio(WHITE, rgb(hsl('--primary')))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(WHITE, rgb(hsl('--destructive-solid')))).toBeGreaterThanOrEqual(4.5);
  });
});
